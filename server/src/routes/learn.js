import { Router } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import PDFDocument from 'pdfkit';
import { one, many, q } from '../db/pool.js';
import { ah, auth, HttpError, JWT_SECRET, logActivity, notify, sendMail, certSignature } from '../lib.js';
import { certificatePdf, invoicePdf } from '../pdf.js';

const r = Router();
const UPLOADS = path.resolve('uploads');

async function courseAccess(user, courseId) {
  if (user.role === 'admin' || user.role === 'instructor') return true;
  return !!(await one('SELECT 1 FROM enrollments WHERE user_id=$1 AND course_id=$2', [user.id, courseId]));
}

async function lessonWithCourse(lessonId) {
  const l = await one(
    `SELECT l.*, m.course_id, c.downloads_allowed, c.title AS course_title FROM lessons l
     JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id WHERE l.id=$1`, [lessonId]);
  if (!l) throw new HttpError(404, 'Leçon introuvable');
  return l;
}

async function requireLessonAccess(req, lessonId) {
  const l = await lessonWithCourse(lessonId);
  if (!l.is_preview && !(await courseAccess(req.user, l.course_id))) throw new HttpError(403, 'Achetez la formation pour accéder à cette leçon');
  return l;
}

async function courseProgress(userId, courseId) {
  const p = await one(
    `SELECT COUNT(l.id)::int AS total, COUNT(lp.lesson_id) FILTER (WHERE lp.completed)::int AS done
     FROM lessons l JOIN modules m ON m.id=l.module_id
     LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$1 WHERE m.course_id=$2`, [userId, courseId]);
  return { ...p, percent: p.total ? Math.round((p.done / p.total) * 100) : 0 };
}

/* ---------------- Tableau de bord apprenant ---------------- */

r.get('/me/dashboard', auth(), ah(async (req, res) => {
  const uid = req.user.id;
  const courses = await many(
    `SELECT c.id, c.slug, c.title, c.image_url, c.level, cat.name AS category, e.created_at AS enrolled_at, e.completed_at, e.last_lesson_id,
       (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=c.id)::int AS total,
       (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id=lp.lesson_id JOIN modules m ON m.id=l.module_id
          WHERE m.course_id=c.id AND lp.user_id=$1 AND lp.completed)::int AS done,
       (SELECT MAX(lp.updated_at) FROM lesson_progress lp JOIN lessons l ON l.id=lp.lesson_id JOIN modules m ON m.id=l.module_id
          WHERE m.course_id=c.id AND lp.user_id=$1) AS last_activity
     FROM enrollments e JOIN courses c ON c.id=e.course_id LEFT JOIN categories cat ON cat.id=c.category_id
     WHERE e.user_id=$1 ORDER BY last_activity DESC NULLS LAST, e.created_at DESC`, [uid]);
  const certificates = await many(
    `SELECT ce.number, ce.score, ce.issued_at, c.title, c.slug FROM certificates ce JOIN courses c ON c.id=ce.course_id
     WHERE ce.user_id=$1 AND NOT ce.revoked ORDER BY ce.issued_at DESC`, [uid]);
  const quizzes = await many(
    `SELECT qa.score, qa.passed, qa.created_at, qz.title, qz.is_final FROM quiz_attempts qa JOIN quizzes qz ON qz.id=qa.quiz_id
     WHERE qa.user_id=$1 ORDER BY qa.created_at DESC LIMIT 20`, [uid]);
  const favorites = await many(
    `SELECT c.id, c.slug, c.title, c.price, c.promo_price, c.level, c.image_url, cat.name AS category FROM favorites f JOIN courses c ON c.id=f.course_id
     LEFT JOIN categories cat ON cat.id=c.category_id WHERE f.user_id=$1`, [uid]);
  const minutes = await one(
    `SELECT COALESCE(SUM(l.duration_min),0)::int AS m FROM lesson_progress lp JOIN lessons l ON l.id=lp.lesson_id WHERE lp.user_id=$1 AND lp.completed`, [uid]);
  res.json({
    courses: courses.map((c) => ({ ...c, percent: c.total ? Math.round((c.done / c.total) * 100) : 0 })),
    certificates, quizzes, favorites, learning_minutes: minutes.m,
  });
}));

r.get('/me/orders', auth(), ah(async (req, res) => {
  res.json(await many(
    `SELECT o.*, c.title, c.slug FROM orders o JOIN courses c ON c.id=o.course_id WHERE o.user_id=$1 ORDER BY o.created_at DESC`, [req.user.id]));
}));

r.get('/me/orders/:ref/invoice', auth(), ah(async (req, res) => {
  const order = await one('SELECT * FROM orders WHERE reference=$1 AND (user_id=$2 OR $3)', [req.params.ref, req.user.id, req.user.role === 'admin']);
  if (!order) throw new HttpError(404, 'Commande introuvable');
  const user = await one('SELECT name,email,phone FROM users WHERE id=$1', [order.user_id]);
  const course = await one('SELECT title FROM courses WHERE id=$1', [order.course_id]);
  invoicePdf(res, { order, user, course });
}));

r.get('/me/certificates/:number/pdf', auth(), ah(async (req, res) => {
  const c = await one(
    `SELECT ce.*, u.name, co.title, co.duration_hours FROM certificates ce JOIN users u ON u.id=ce.user_id JOIN courses co ON co.id=ce.course_id
     WHERE ce.number=$1 AND (ce.user_id=$2 OR $3)`, [req.params.number, req.user.id, req.user.role === 'admin']);
  if (!c) throw new HttpError(404, 'Attestation introuvable');
  await certificatePdf(res, {
    number: c.number, name: c.name, course: c.title, score: c.score, issuedAt: c.issued_at, signature: c.signature,
    hours: Number(c.duration_hours), verifyUrl: `${process.env.CLIENT_URL}/verifier/${c.number}`,
  });
}));

r.get('/me/favorites', auth(), ah(async (req, res) => {
  res.json((await many('SELECT course_id FROM favorites WHERE user_id=$1', [req.user.id])).map((x) => x.course_id));
}));
r.post('/me/favorites/:courseId', auth(), ah(async (req, res) => {
  await q('INSERT INTO favorites (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, req.params.courseId]);
  res.json({ ok: true });
}));
r.delete('/me/favorites/:courseId', auth(), ah(async (req, res) => {
  await q('DELETE FROM favorites WHERE user_id=$1 AND course_id=$2', [req.user.id, req.params.courseId]);
  res.json({ ok: true });
}));

r.get('/me/notifications', auth(), ah(async (req, res) => {
  res.json(await many('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30', [req.user.id]));
}));
r.post('/me/notifications/read', auth(), ah(async (req, res) => {
  await q('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
  res.json({ ok: true });
}));

r.get('/me/notes', auth(), ah(async (req, res) => {
  res.json(await many(
    `SELECT n.content, n.updated_at, l.id AS lesson_id, l.title AS lesson, c.title AS course, c.slug FROM notes n
     JOIN lessons l ON l.id=n.lesson_id JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id
     WHERE n.user_id=$1 AND n.content<>'' ORDER BY n.updated_at DESC`, [req.user.id]));
}));

r.post('/courses/:id/reviews', auth(), ah(async (req, res) => {
  const { rating, comment } = req.body || {};
  if (!(await courseAccess(req.user, req.params.id))) throw new HttpError(403, 'Seuls les apprenants inscrits peuvent laisser un avis');
  const rt = Math.max(1, Math.min(5, Number(rating) || 5));
  await q(`INSERT INTO reviews (user_id,course_id,rating,comment) VALUES ($1,$2,$3,$4)
           ON CONFLICT (user_id,course_id) DO UPDATE SET rating=EXCLUDED.rating, comment=EXCLUDED.comment, created_at=now()`,
    [req.user.id, req.params.id, rt, comment || null]);
  res.json({ ok: true });
}));

/* ---------------- Lecteur de cours ---------------- */

r.get('/learn/:slug', auth(), ah(async (req, res) => {
  const c = await one('SELECT id, slug, title, pass_score, downloads_allowed, final_project, duration_hours FROM courses WHERE slug=$1', [req.params.slug]);
  if (!c) throw new HttpError(404, 'Formation introuvable');
  if (!(await courseAccess(req.user, c.id))) throw new HttpError(403, 'Vous n’êtes pas inscrit à cette formation');
  const modules = await many('SELECT id, title FROM modules WHERE course_id=$1 ORDER BY position, id', [c.id]);
  const lessons = await many(
    `SELECT l.id, l.module_id, l.title, l.type, l.content, l.duration_min, (l.file_url IS NOT NULL) AS has_file,
       COALESCE(lp.completed,false) AS completed, COALESCE(lp.position_seconds,0) AS position_seconds
     FROM lessons l JOIN modules m ON m.id=l.module_id LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$2
     WHERE m.course_id=$1 ORDER BY m.position, m.id, l.position, l.id`, [c.id, req.user.id]);
  const quizzes = await many(
    `SELECT qz.id, qz.module_id, qz.title, qz.is_final,
       (SELECT MAX(score) FROM quiz_attempts qa WHERE qa.quiz_id=qz.id AND qa.user_id=$2) AS best_score
     FROM quizzes qz WHERE qz.course_id=$1`, [c.id, req.user.id]);
  const enr = await one('SELECT last_lesson_id, completed_at FROM enrollments WHERE user_id=$1 AND course_id=$2', [req.user.id, c.id]);
  const certificate = await one('SELECT number, score, issued_at FROM certificates WHERE user_id=$1 AND course_id=$2', [req.user.id, c.id]);
  res.json({
    ...c,
    modules: modules.map((m) => ({ ...m, lessons: lessons.filter((l) => l.module_id === m.id), quiz: quizzes.find((x) => x.module_id === m.id) || null })),
    final_quiz: quizzes.find((x) => x.is_final) || null,
    progress: await courseProgress(req.user.id, c.id),
    last_lesson_id: enr?.last_lesson_id || null,
    certificate,
  });
}));

// Jeton de lecture temporaire lié à l'utilisateur, à sa session et à la leçon : l'URL réelle de la vidéo n'est jamais exposée.
// Durée limitée à 2 h (le lecteur redemande un jeton automatiquement en cas d'expiration).
r.get('/learn/lessons/:id/stream-token', auth(), ah(async (req, res) => {
  const l = await requireLessonAccess(req, req.params.id);
  if (l.type !== 'video' || !l.video_url) throw new HttpError(400, 'Pas de vidéo pour cette leçon');
  const t = jwt.sign({ lid: l.id, uid: req.user.id, sid: req.user.sid, typ: 'stream' }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ url: `/api/stream/${l.id}?t=${t}` });
}));

r.get('/stream/:id', ah(async (req, res) => {
  let p;
  try { p = jwt.verify(String(req.query.t || ''), JWT_SECRET); } catch { throw new HttpError(401, 'Lien vidéo expiré'); }
  if (p.typ !== 'stream' || String(p.lid) !== String(req.params.id)) throw new HttpError(403, 'Lien vidéo invalide');
  // Le lien meurt avec la session : un compte déconnecté (limite d'appareils) ne peut plus lire
  if (!(await one('SELECT 1 FROM sessions WHERE id=$1 AND user_id=$2', [p.sid, p.uid]))) throw new HttpError(401, 'Session expirée');
  const l = await lessonWithCourse(req.params.id);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (/^https?:\/\//.test(l.video_url)) {
    const upstream = await fetch(l.video_url, { headers: req.headers.range ? { Range: req.headers.range } : {} });
    res.status(upstream.status);
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const v = upstream.headers.get(h); if (v) res.setHeader(h, v);
    }
    if (!upstream.body) return res.end();
    const stream = Readable.fromWeb(upstream.body);
    req.on('close', () => stream.destroy());
    return stream.pipe(res);
  }
  // Fichier local (uploads/)
  const file = path.join(UPLOADS, path.basename(l.video_url));
  if (!fs.existsSync(file)) throw new HttpError(404, 'Vidéo introuvable');
  const size = fs.statSync(file).size;
  const range = req.headers.range;
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  if (range) {
    const [s, e] = range.replace(/bytes=/, '').split('-');
    const start = Number(s), end = e ? Number(e) : Math.min(start + 2_000_000, size - 1);
    res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    res.setHeader('Content-Length', end - start + 1);
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.setHeader('Content-Length', size);
  fs.createReadStream(file).pipe(res);
}));

// Support PDF : téléchargement selon les droits définis par l'administrateur
r.get('/learn/lessons/:id/file', auth(), ah(async (req, res) => {
  const l = await requireLessonAccess(req, req.params.id);
  if (!l.file_url) throw new HttpError(404, 'Aucun document pour cette leçon');
  if (!l.downloads_allowed && req.user.role === 'student') throw new HttpError(403, 'Le téléchargement est désactivé pour cette formation');
  await logActivity(req, 'download', { lesson: l.id });
  if (l.file_url !== 'support') {
    const file = path.join(UPLOADS, path.basename(l.file_url));
    if (!fs.existsSync(file)) throw new HttpError(404, 'Fichier introuvable');
    return res.download(file);
  }
  // Support de cours généré automatiquement
  const doc = new PDFDocument({ margin: 60 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="support-lecon-${l.id}.pdf"`);
  doc.pipe(res);
  doc.image(path.resolve('src/logo.jpg'), 60, 40, { width: 60 });
  doc.moveDown(4).fillColor('#B8902A').fontSize(10).text('PERFEKT ACADEMY — SUPPORT DE COURS', { characterSpacing: 2 });
  doc.moveDown(0.5).fillColor('#111').fontSize(22).text(l.title);
  doc.fillColor('#666').fontSize(11).text(l.course_title).moveDown(1.5);
  doc.fillColor('#222').fontSize(12).text(l.content || '', { lineGap: 4 });
  doc.moveDown(2).fontSize(9).fillColor('#999').text(`Document réservé à ${req.user.name} — reproduction interdite.`);
  doc.end();
}));

r.post('/learn/lessons/:id/progress', auth(), ah(async (req, res) => {
  const l = await requireLessonAccess(req, req.params.id);
  const { position = 0, completed } = req.body || {};
  await q(
    `INSERT INTO lesson_progress (user_id,lesson_id,position_seconds,completed,updated_at) VALUES ($1,$2,$3,$4,now())
     ON CONFLICT (user_id,lesson_id) DO UPDATE SET position_seconds=EXCLUDED.position_seconds,
       completed = lesson_progress.completed OR EXCLUDED.completed, updated_at=now()`,
    [req.user.id, l.id, Math.max(0, Math.floor(position)), !!completed]);
  await q('UPDATE enrollments SET last_lesson_id=$1 WHERE user_id=$2 AND course_id=$3', [l.id, req.user.id, l.course_id]);
  res.json({ progress: await courseProgress(req.user.id, l.course_id) });
}));

r.get('/learn/lessons/:id/note', auth(), ah(async (req, res) => {
  await requireLessonAccess(req, req.params.id);
  const n = await one('SELECT content FROM notes WHERE user_id=$1 AND lesson_id=$2', [req.user.id, req.params.id]);
  res.json({ content: n?.content || '' });
}));
r.put('/learn/lessons/:id/note', auth(), ah(async (req, res) => {
  await requireLessonAccess(req, req.params.id);
  await q(`INSERT INTO notes (user_id,lesson_id,content) VALUES ($1,$2,$3)
           ON CONFLICT (user_id,lesson_id) DO UPDATE SET content=EXCLUDED.content, updated_at=now()`,
    [req.user.id, req.params.id, String(req.body?.content || '').slice(0, 20000)]);
  res.json({ ok: true });
}));

// Forum / questions au formateur
r.get('/learn/lessons/:id/comments', auth(), ah(async (req, res) => {
  await requireLessonAccess(req, req.params.id);
  res.json(await many(
    `SELECT cm.id, cm.parent_id, cm.content, cm.is_question, cm.created_at, u.name, u.role FROM comments cm JOIN users u ON u.id=cm.user_id
     WHERE cm.lesson_id=$1 AND cm.approved ORDER BY cm.created_at ASC`, [req.params.id]));
}));
r.post('/learn/lessons/:id/comments', auth(), ah(async (req, res) => {
  const l = await requireLessonAccess(req, req.params.id);
  const { content, is_question, parent_id } = req.body || {};
  if (!content?.trim()) throw new HttpError(400, 'Message vide');
  const c = await one('INSERT INTO comments (lesson_id,user_id,parent_id,content,is_question) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [l.id, req.user.id, parent_id || null, content.trim().slice(0, 5000), !!is_question]);
  if (parent_id) {
    const parent = await one('SELECT user_id FROM comments WHERE id=$1', [parent_id]);
    if (parent && parent.user_id !== req.user.id) await notify(parent.user_id, 'Nouvelle réponse à votre message', `${req.user.name} a répondu dans « ${l.title} »`);
  }
  res.status(201).json({ id: c.id });
}));

r.get('/learn/lessons/:id/submission', auth(), ah(async (req, res) => {
  await requireLessonAccess(req, req.params.id);
  res.json(await one('SELECT * FROM submissions WHERE user_id=$1 AND lesson_id=$2 ORDER BY created_at DESC LIMIT 1', [req.user.id, req.params.id]));
}));
r.post('/learn/lessons/:id/submission', auth(), ah(async (req, res) => {
  const l = await requireLessonAccess(req, req.params.id);
  const content = String(req.body?.content || '').trim();
  if (content.length < 10) throw new HttpError(400, 'Décrivez votre travail (10 caractères minimum)');
  await q('INSERT INTO submissions (user_id,lesson_id,content) VALUES ($1,$2,$3)', [req.user.id, l.id, content.slice(0, 10000)]);
  await q(`INSERT INTO lesson_progress (user_id,lesson_id,completed) VALUES ($1,$2,true)
           ON CONFLICT (user_id,lesson_id) DO UPDATE SET completed=true, updated_at=now()`, [req.user.id, l.id]);
  res.status(201).json({ progress: await courseProgress(req.user.id, l.course_id) });
}));

/* ---------------- Quiz & examen final ---------------- */

async function quizAccess(req) {
  const qz = await one('SELECT qz.*, c.pass_score, c.title AS course_title FROM quizzes qz JOIN courses c ON c.id=qz.course_id WHERE qz.id=$1', [req.params.id]);
  if (!qz) throw new HttpError(404, 'Quiz introuvable');
  if (!(await courseAccess(req.user, qz.course_id))) throw new HttpError(403, 'Accès refusé');
  if (qz.is_final && req.user.role === 'student') {
    const p = await courseProgress(req.user.id, qz.course_id);
    if (p.done < p.total) throw new HttpError(403, `Terminez toutes les leçons avant l’examen final (${p.done}/${p.total})`);
  }
  return qz;
}

r.get('/learn/quizzes/:id', auth(), ah(async (req, res) => {
  const qz = await quizAccess(req);
  const questions = await many('SELECT id, question, options FROM questions WHERE quiz_id=$1 ORDER BY position, id', [qz.id]);
  res.json({ id: qz.id, title: qz.title, is_final: qz.is_final, pass_score: qz.pass_score, questions });
}));

r.post('/learn/quizzes/:id/submit', auth(), ah(async (req, res) => {
  const qz = await quizAccess(req);
  const answers = req.body?.answers || {};
  const questions = await many('SELECT id, correct_index FROM questions WHERE quiz_id=$1', [qz.id]);
  if (!questions.length) throw new HttpError(400, 'Ce quiz ne contient aucune question');
  const correct = questions.filter((x) => Number(answers[x.id]) === x.correct_index).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= qz.pass_score;
  await q('INSERT INTO quiz_attempts (user_id,quiz_id,score,passed) VALUES ($1,$2,$3,$4)', [req.user.id, qz.id, score, passed]);

  let certificate = null;
  if (qz.is_final && passed) {
    // Validation automatique + génération de l'attestation
    certificate = await one('SELECT number FROM certificates WHERE user_id=$1 AND course_id=$2', [req.user.id, qz.course_id]);
    if (!certificate) {
      const number = `PA-${new Date().getFullYear()}-${String(qz.course_id).padStart(3, '0')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const signature = certSignature(number, req.user.id, qz.course_id, score);
      certificate = await one('INSERT INTO certificates (number,user_id,course_id,score,signature) VALUES ($1,$2,$3,$4,$5) RETURNING number',
        [number, req.user.id, qz.course_id, score, signature]);
      await q('UPDATE enrollments SET completed_at=now() WHERE user_id=$1 AND course_id=$2', [req.user.id, qz.course_id]);
      await notify(req.user.id, '🎓 Attestation obtenue !', `Félicitations, vous avez validé « ${qz.course_title} ».`, '/compte/attestations');
      await sendMail(req.user.email, 'Votre attestation PERFEKT Academy', `Félicitations ${req.user.name} !\nVotre attestation n° ${number} est disponible dans votre espace.`);
      await logActivity(req, 'certificate_issued', { number });
    }
  }
  res.json({
    score, passed, correct, total: questions.length, pass_score: qz.pass_score, certificate,
    corrections: Object.fromEntries(questions.map((x) => [x.id, x.correct_index])),
  });
}));

export default r;

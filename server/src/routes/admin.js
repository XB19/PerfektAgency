import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { one, many, q } from '../db/pool.js';
import { ah, auth, requireRole, HttpError, slugify, logActivity, sendMail, notify } from '../lib.js';

const r = Router();
r.use(auth(), requireRole('admin', 'instructor'));
const adminOnly = requireRole('admin');

/* ---------------- Statistiques ---------------- */
r.get('/stats', ah(async (req, res) => {
  const k = await one(`SELECT
    (SELECT COALESCE(SUM(amount),0) FROM orders WHERE status='paid')::int AS revenue,
    (SELECT COALESCE(SUM(amount),0) FROM orders WHERE status='paid' AND paid_at > date_trunc('month', now()))::int AS revenue_month,
    (SELECT COUNT(*) FROM orders WHERE status='paid')::int AS sales,
    (SELECT COUNT(*) FROM users WHERE role='student')::int AS students,
    (SELECT COUNT(*) FROM users WHERE created_at > now() - interval '30 days')::int AS new_users,
    (SELECT COUNT(*) FROM courses)::int AS courses,
    (SELECT COUNT(*) FROM enrollments)::int AS enrollments,
    (SELECT COUNT(*) FROM certificates)::int AS certificates,
    (SELECT COUNT(*) FROM quotes WHERE status='nouveau')::int AS new_quotes,
    (SELECT COUNT(*) FROM messages WHERE NOT is_read)::int AS unread_messages,
    (SELECT COUNT(*) FROM newsletter)::int AS subscribers,
    (SELECT COUNT(*) FROM submissions WHERE grade IS NULL)::int AS pending_submissions,
    (SELECT COALESCE(ROUND(AVG(CASE WHEN completed_at IS NOT NULL THEN 100 ELSE 0 END)),0) FROM enrollments)::int AS completion_rate`);
  const monthly = await many(`
    SELECT to_char(m, 'YYYY-MM') AS month,
      COALESCE((SELECT SUM(amount) FROM orders WHERE status='paid' AND date_trunc('month',paid_at)=m),0)::int AS revenue,
      COALESCE((SELECT COUNT(*) FROM enrollments WHERE date_trunc('month',created_at)=m),0)::int AS enrollments
    FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m`);
  const top = await many(`SELECT c.title, COUNT(e.id)::int AS students,
      COALESCE((SELECT SUM(amount) FROM orders o WHERE o.course_id=c.id AND o.status='paid'),0)::int AS revenue
    FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id GROUP BY c.id ORDER BY students DESC LIMIT 6`);
  const methods = await many(`SELECT method, COUNT(*)::int AS n, SUM(amount)::int AS total FROM orders WHERE status='paid' GROUP BY method`);
  const recentOrders = await many(`SELECT o.reference, o.amount, o.status, o.method, o.created_at, u.name, c.title FROM orders o
    JOIN users u ON u.id=o.user_id JOIN courses c ON c.id=o.course_id ORDER BY o.created_at DESC LIMIT 8`);
  const activity = await many(`SELECT a.action, a.created_at, a.ip, u.name FROM activity_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 12`);
  res.json({ kpis: k, monthly, top, methods, recentOrders, activity });
}));

/* ---------------- CRUD générique ---------------- */
const RES = {
  users: { table: 'users', cols: ['name', 'email', 'role', 'phone', 'country', 'city', 'is_active'], search: ['name', 'email'],
    select: 'id,name,email,role,phone,country,city,is_active,created_at,(SELECT COUNT(*) FROM enrollments e WHERE e.user_id=users.id)::int AS courses', admin: true },
  categories: { table: 'categories', cols: ['name', 'slug', 'description'], search: ['name'], slugFrom: 'name' },
  posts: { table: 'posts', cols: ['title', 'slug', 'category', 'excerpt', 'content', 'cover_url', 'author', 'read_minutes', 'seo_title', 'seo_description', 'published'], search: ['title'], slugFrom: 'title' },
  projects: { table: 'projects', cols: ['title', 'slug', 'category', 'client', 'year', 'description', 'cover_url', 'before_url', 'after_url', 'gallery', 'featured'], search: ['title', 'client'], slugFrom: 'title', json: ['gallery'] },
  coupons: { table: 'coupons', cols: ['code', 'percent', 'max_uses', 'expires_at', 'active'], search: ['code'] },
  quotes: { table: 'quotes', cols: ['status'], search: ['name', 'email', 'company', 'service'] },
  messages: { table: 'messages', cols: ['is_read'], search: ['name', 'email', 'subject'] },
  newsletter: { table: 'newsletter', cols: ['email'], search: ['email'] },
  reviews: { table: 'reviews', cols: ['approved', 'rating', 'comment'], search: ['comment'],
    select: 'reviews.*, (SELECT name FROM users WHERE id=reviews.user_id) AS user_name, (SELECT title FROM courses WHERE id=reviews.course_id) AS course' },
  comments: { table: 'comments', cols: ['approved', 'content'], search: ['content'],
    select: 'comments.*, (SELECT name FROM users WHERE id=comments.user_id) AS user_name, (SELECT title FROM lessons WHERE id=comments.lesson_id) AS lesson' },
  certificates: { table: 'certificates', cols: ['revoked'], search: ['number'],
    select: 'certificates.*, (SELECT name FROM users WHERE id=certificates.user_id) AS user_name, (SELECT title FROM courses WHERE id=certificates.course_id) AS course' },
  orders: { table: 'orders', cols: ['status'], search: ['reference', 'method'], admin: true,
    select: 'orders.*, (SELECT name FROM users WHERE id=orders.user_id) AS user_name, (SELECT title FROM courses WHERE id=orders.course_id) AS course' },
  submissions: { table: 'submissions', cols: ['grade', 'feedback'], search: ['content'],
    select: 'submissions.*, (SELECT name FROM users WHERE id=submissions.user_id) AS user_name, (SELECT title FROM lessons WHERE id=submissions.lesson_id) AS lesson' },
  activity: { table: 'activity_log', cols: [], search: ['action', 'ip'], readonly: true, admin: true,
    select: 'activity_log.*, (SELECT name FROM users WHERE id=activity_log.user_id) AS user_name' },
};

function resource(req) {
  const res = RES[req.params.res];
  if (!res) throw new HttpError(404, 'Ressource inconnue');
  if (res.admin && req.user.role !== 'admin') throw new HttpError(403, 'Réservé aux administrateurs');
  return res;
}
function pick(def, body) {
  const out = {};
  for (const c of def.cols) if (body[c] !== undefined) out[c] = body[c] === '' ? null : body[c];
  // Colonnes JSON : accepte un tableau ou un texte (une valeur par ligne)
  for (const c of def.json || []) {
    if (out[c] === undefined) continue;
    const v = out[c] == null ? [] : Array.isArray(out[c]) ? out[c] : String(out[c]).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    out[c] = JSON.stringify(v);
  }
  if (def.slugFrom && !out.slug && out[def.slugFrom]) out.slug = slugify(out[def.slugFrom]);
  if (out.slug) out.slug = slugify(out.slug);
  if (out.code) out.code = String(out.code).toUpperCase().trim();
  return out;
}

r.get('/r/:res', ah(async (req, res) => {
  const def = resource(req);
  const p = []; let where = '';
  if (req.query.q && def.search.length) {
    p.push(`%${req.query.q}%`);
    where = 'WHERE ' + def.search.map((c) => `${def.table}.${c}::text ILIKE $1`).join(' OR ');
  }
  const order = def.table === 'newsletter' || def.table === 'categories' ? 'id DESC' : 'created_at DESC';
  res.json(await many(`SELECT ${def.select || '*'} FROM ${def.table} ${where} ORDER BY ${order} LIMIT 500`, p));
}));

r.post('/r/:res', ah(async (req, res) => {
  const def = resource(req);
  if (def.readonly) throw new HttpError(405, 'Lecture seule');
  const data = pick(def, req.body || {});
  if (def.table === 'users') {
    if (req.user.role !== 'admin') throw new HttpError(403, 'Accès refusé');
    const pwd = req.body.password || crypto.randomBytes(6).toString('base64url');
    data.password_hash = await bcrypt.hash(pwd, 10);
    data.email = String(data.email || '').toLowerCase();
  }
  const keys = Object.keys(data);
  if (!keys.length) throw new HttpError(400, 'Aucune donnée');
  const row = await one(`INSERT INTO ${def.table} (${keys.join(',')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, Object.values(data));
  await logActivity(req, `admin_create_${req.params.res}`, { id: row.id });
  delete row.password_hash;
  res.status(201).json(row);
}));

r.put('/r/:res/:id', ah(async (req, res) => {
  const def = resource(req);
  if (def.readonly) throw new HttpError(405, 'Lecture seule');
  const data = pick(def, req.body || {});
  if (def.table === 'users' && req.body.password) data.password_hash = await bcrypt.hash(req.body.password, 10);
  const keys = Object.keys(data);
  if (!keys.length) throw new HttpError(400, 'Aucune donnée');
  const row = await one(`UPDATE ${def.table} SET ${keys.map((k, i) => `${k}=$${i + 1}`).join(',')} WHERE id=$${keys.length + 1} RETURNING *`, [...Object.values(data), req.params.id]);
  if (!row) throw new HttpError(404, 'Introuvable');
  if (def.table === 'submissions' && data.grade != null) await notify(row.user_id, 'Votre travail a été évalué', `Note : ${row.grade}/20`);
  if (def.table === 'users' && data.is_active === false) await q('DELETE FROM sessions WHERE user_id=$1', [row.id]);
  await logActivity(req, `admin_update_${req.params.res}`, { id: row.id });
  delete row.password_hash;
  res.json(row);
}));

r.delete('/r/:res/:id', ah(async (req, res) => {
  const def = resource(req);
  if (def.readonly) throw new HttpError(405, 'Lecture seule');
  if (def.table === 'users' && Number(req.params.id) === req.user.id) throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte');
  await q(`DELETE FROM ${def.table} WHERE id=$1`, [req.params.id]);
  await logActivity(req, `admin_delete_${req.params.res}`, { id: req.params.id });
  res.json({ ok: true });
}));

// Inscription manuelle d'un étudiant à une formation
r.post('/enroll', adminOnly, ah(async (req, res) => {
  const { userId, courseId } = req.body || {};
  await q('INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, courseId]);
  await notify(userId, 'Nouvelle formation disponible', 'Un administrateur vous a donné accès à une formation.', '/compte');
  res.json({ ok: true });
}));

/* ---------------- Formations : éditeur complet ---------------- */
const COURSE_COLS = ['title', 'slug', 'subtitle', 'description', 'category_id', 'level', 'price', 'promo_price', 'duration_hours', 'sessions', 'image_url',
  'preview_video_url', 'objectives', 'prerequisites', 'skills', 'faq', 'final_project', 'instructor_name', 'pass_score', 'downloads_allowed', 'published', 'featured'];
const JSON_COLS = ['objectives', 'prerequisites', 'skills', 'faq'];

function courseData(body) {
  const d = {};
  for (const c of COURSE_COLS) if (body[c] !== undefined) d[c] = JSON_COLS.includes(c) ? JSON.stringify(body[c] || []) : body[c] === '' ? null : body[c];
  if (d.title && !d.slug) d.slug = slugify(d.title);
  if (d.slug) d.slug = slugify(d.slug);
  return d;
}

r.get('/courses', ah(async (req, res) => {
  res.json(await many(`SELECT c.id, c.slug, c.title, c.level, c.price, c.promo_price, c.published, c.featured, cat.name AS category,
    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id)::int AS students,
    (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=c.id)::int AS lessons
    FROM courses c LEFT JOIN categories cat ON cat.id=c.category_id ORDER BY c.created_at DESC`));
}));

r.get('/courses/:id', ah(async (req, res) => {
  const c = await one('SELECT * FROM courses WHERE id=$1', [req.params.id]);
  if (!c) throw new HttpError(404, 'Formation introuvable');
  const modules = await many('SELECT * FROM modules WHERE course_id=$1 ORDER BY position, id', [c.id]);
  const lessons = await many('SELECT l.* FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=$1 ORDER BY l.position, l.id', [c.id]);
  const quizzes = await many('SELECT * FROM quizzes WHERE course_id=$1 ORDER BY id', [c.id]);
  const questions = await many('SELECT qs.* FROM questions qs JOIN quizzes qz ON qz.id=qs.quiz_id WHERE qz.course_id=$1 ORDER BY qs.position, qs.id', [c.id]);
  res.json({
    ...c,
    modules: modules.map((m) => ({ ...m, lessons: lessons.filter((l) => l.module_id === m.id) })),
    quizzes: quizzes.map((qz) => ({ ...qz, questions: questions.filter((x) => x.quiz_id === qz.id) })),
  });
}));

r.post('/courses', ah(async (req, res) => {
  const d = courseData(req.body || {});
  if (!d.title) throw new HttpError(400, 'Titre requis');
  const keys = Object.keys(d);
  const c = await one(`INSERT INTO courses (${keys}) VALUES (${keys.map((_, i) => `$${i + 1}`)}) RETURNING id`, Object.values(d));
  await q('INSERT INTO quizzes (course_id,title,is_final) VALUES ($1,$2,true)', [c.id, `Examen final — ${d.title}`]);
  await logActivity(req, 'admin_create_course', { id: c.id });
  res.status(201).json(c);
}));

r.put('/courses/:id', ah(async (req, res) => {
  const d = courseData(req.body || {});
  const keys = Object.keys(d);
  if (!keys.length) throw new HttpError(400, 'Aucune donnée');
  await q(`UPDATE courses SET ${keys.map((k, i) => `${k}=$${i + 1}`)} WHERE id=$${keys.length + 1}`, [...Object.values(d), req.params.id]);
  await logActivity(req, 'admin_update_course', { id: req.params.id });
  res.json({ ok: true });
}));

r.delete('/courses/:id', adminOnly, ah(async (req, res) => {
  await q('DELETE FROM courses WHERE id=$1', [req.params.id]);
  await logActivity(req, 'admin_delete_course', { id: req.params.id });
  res.json({ ok: true });
}));

// Sous-éléments : modules, leçons, quiz, questions
const SUB = {
  modules: { cols: ['course_id', 'title', 'position'] },
  lessons: { cols: ['module_id', 'title', 'type', 'video_url', 'file_url', 'content', 'duration_min', 'position', 'is_preview'] },
  quizzes: { cols: ['course_id', 'module_id', 'title', 'is_final'] },
  questions: { cols: ['quiz_id', 'question', 'options', 'correct_index', 'position'], json: ['options'] },
};
function subData(name, body) {
  const def = SUB[name]; if (!def) throw new HttpError(404, 'Inconnu');
  const d = {};
  for (const c of def.cols) if (body[c] !== undefined) d[c] = def.json?.includes(c) ? JSON.stringify(body[c]) : body[c] === '' ? null : body[c];
  return d;
}
r.post('/sub/:name', ah(async (req, res) => {
  const d = subData(req.params.name, req.body || {});
  const keys = Object.keys(d);
  res.status(201).json(await one(`INSERT INTO ${req.params.name} (${keys}) VALUES (${keys.map((_, i) => `$${i + 1}`)}) RETURNING *`, Object.values(d)));
}));
r.put('/sub/:name/:id', ah(async (req, res) => {
  const d = subData(req.params.name, req.body || {});
  const keys = Object.keys(d);
  if (!keys.length) throw new HttpError(400, 'Aucune donnée');
  res.json(await one(`UPDATE ${req.params.name} SET ${keys.map((k, i) => `${k}=$${i + 1}`)} WHERE id=$${keys.length + 1} RETURNING *`, [...Object.values(d), req.params.id]));
}));
r.delete('/sub/:name/:id', ah(async (req, res) => {
  if (!SUB[req.params.name]) throw new HttpError(404, 'Inconnu');
  await q(`DELETE FROM ${req.params.name} WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}));

/* ---------------- Contenu du site ---------------- */
r.put('/settings/:key', adminOnly, ah(async (req, res) => {
  await q('INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value', [req.params.key, JSON.stringify(req.body?.value ?? null)]);
  await logActivity(req, 'admin_settings', { key: req.params.key });
  res.json({ ok: true });
}));

/* ---------------- Newsletter ---------------- */
r.post('/newsletter/send', adminOnly, ah(async (req, res) => {
  const { subject, body } = req.body || {};
  if (!subject || !body) throw new HttpError(400, 'Objet et contenu requis');
  const subs = await many('SELECT email FROM newsletter');
  for (const s of subs) await sendMail(s.email, subject, body);
  await logActivity(req, 'newsletter_sent', { subject, count: subs.length });
  res.json({ sent: subs.length });
}));

/* ---------------- Upload (images, vidéos, PDF) ---------------- */
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /\.(png|jpe?g|webp|gif|svg|mp4|webm|mov|pdf|zip)$/i.test(file.originalname)),
});
r.post('/upload', upload.single('file'), ah(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Fichier refusé (formats : images, mp4, webm, pdf, zip)');
  const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(req.file.filename);
  // Les images sont publiques ; vidéos et documents restent privés (servis via les routes protégées)
  res.json({ url: isImage ? `/uploads/${req.file.filename}` : req.file.filename, filename: req.file.filename });
}));

export default r;

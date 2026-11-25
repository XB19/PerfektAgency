import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { one, many, q } from '../db/pool.js';
import { ah, auth, HttpError, logActivity, sendMail } from '../lib.js';

const r = Router();
const formLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, message: { error: 'Trop de demandes, réessayez plus tard.' } });
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

const COURSE_BASE = `c.id, c.slug, c.title, c.subtitle, c.level, c.price, c.promo_price, c.duration_hours, c.sessions, c.image_url, c.featured, c.created_at,`;
const COURSE_STATS = `
  cat.name AS category, cat.slug AS category_slug,
  COALESCE(ROUND(AVG(rv.rating)::numeric,1),0)::float AS rating, COUNT(DISTINCT rv.id)::int AS reviews_count,
  (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id=c.id)::int AS lessons_count,
  (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id)::int AS students_count`;

r.get('/settings', ah(async (req, res) => {
  const rows = await many('SELECT key, value FROM settings');
  res.json(Object.fromEntries(rows.map((x) => [x.key, x.value])));
}));

r.get('/categories', ah(async (req, res) => {
  res.json(await many(`SELECT cat.*, (SELECT COUNT(*) FROM courses c WHERE c.category_id=cat.id AND c.published)::int AS courses_count FROM categories cat ORDER BY name`));
}));

r.get('/courses', ah(async (req, res) => {
  const { q: search, category, level, maxPrice, maxHours, sort, featured, ids } = req.query;
  const where = ['c.published'];
  const p = [];
  if (search) {
    p.push(`%${search}%`);
    where.push(`(c.title ILIKE $${p.length} OR c.subtitle ILIKE $${p.length} OR cat.name ILIKE $${p.length} OR c.skills::text ILIKE $${p.length})`);
  }
  if (category) { p.push(category); where.push(`cat.slug=$${p.length}`); }
  if (level) { p.push(level); where.push(`c.level=$${p.length}`); }
  if (maxPrice) { p.push(Number(maxPrice)); where.push(`COALESCE(c.promo_price,c.price)<=$${p.length}`); }
  if (maxHours) { p.push(Number(maxHours)); where.push(`c.duration_hours<=$${p.length}`); }
  if (featured) where.push('c.featured');
  if (ids) { p.push(String(ids).split(',').map(Number).filter(Boolean)); where.push(`c.id = ANY($${p.length})`); }
  const order = {
    price_asc: 'COALESCE(c.promo_price,c.price) ASC', price_desc: 'COALESCE(c.promo_price,c.price) DESC',
    rating: 'rating DESC', newest: 'c.created_at DESC', popular: 'students_count DESC',
  }[sort] || 'c.featured DESC, c.created_at DESC';
  const rows = await many(
    `SELECT ${COURSE_BASE} ${COURSE_STATS}, c.objectives, c.skills, c.prerequisites
     FROM courses c LEFT JOIN categories cat ON cat.id=c.category_id LEFT JOIN reviews rv ON rv.course_id=c.id AND rv.approved
     WHERE ${where.join(' AND ')} GROUP BY c.id, cat.id ORDER BY ${order}`, p);
  res.json(rows);
}));

r.get('/courses/:slug', auth(false), ah(async (req, res) => {
  const c = await one(
    `SELECT c.*, ${COURSE_STATS}
     FROM courses c LEFT JOIN categories cat ON cat.id=c.category_id LEFT JOIN reviews rv ON rv.course_id=c.id AND rv.approved
     WHERE c.slug=$1 AND (c.published OR $2) GROUP BY c.id, cat.id`,
    [req.params.slug, req.user?.role === 'admin']);
  if (!c) throw new HttpError(404, 'Formation introuvable');
  const modules = await many('SELECT id, title, position FROM modules WHERE course_id=$1 ORDER BY position, id', [c.id]);
  const lessons = await many(
    `SELECT l.id, l.module_id, l.title, l.type, l.duration_min, l.is_preview, l.position FROM lessons l
     JOIN modules m ON m.id=l.module_id WHERE m.course_id=$1 ORDER BY l.position, l.id`, [c.id]);
  const quizzes = await many('SELECT id, module_id, title, is_final FROM quizzes WHERE course_id=$1', [c.id]);
  const reviews = await many(
    `SELECT rv.id, rv.rating, rv.comment, rv.created_at, u.name FROM reviews rv JOIN users u ON u.id=rv.user_id
     WHERE rv.course_id=$1 AND rv.approved ORDER BY rv.created_at DESC LIMIT 20`, [c.id]);
  let enrolled = false, favorite = false;
  if (req.user) {
    enrolled = !!(await one('SELECT 1 FROM enrollments WHERE user_id=$1 AND course_id=$2', [req.user.id, c.id]));
    favorite = !!(await one('SELECT 1 FROM favorites WHERE user_id=$1 AND course_id=$2', [req.user.id, c.id]));
  }
  // La vidéo d'aperçu est publique ; les vidéos de leçons ne sont jamais exposées ici.
  res.json({
    ...c,
    modules: modules.map((m) => ({ ...m, lessons: lessons.filter((l) => l.module_id === m.id), quiz: quizzes.find((x) => x.module_id === m.id) || null })),
    final_quiz: quizzes.find((x) => x.is_final) || null,
    reviews, enrolled, favorite,
  });
}));

r.get('/posts', ah(async (req, res) => {
  const { category, q: search, limit } = req.query;
  const p = []; const where = ['published'];
  if (category) { p.push(category); where.push(`category=$${p.length}`); }
  if (search) { p.push(`%${search}%`); where.push(`(title ILIKE $${p.length} OR excerpt ILIKE $${p.length})`); }
  p.push(Math.min(Number(limit) || 50, 100));
  res.json(await many(`SELECT id, slug, title, excerpt, category, cover_url, author, read_minutes, created_at FROM posts WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT $${p.length}`, p));
}));

r.get('/posts/:slug', ah(async (req, res) => {
  const post = await one('SELECT * FROM posts WHERE slug=$1 AND published', [req.params.slug]);
  if (!post) throw new HttpError(404, 'Article introuvable');
  const related = await many('SELECT slug, title, category, cover_url, created_at, read_minutes FROM posts WHERE published AND id<>$1 ORDER BY (category=$2) DESC, created_at DESC LIMIT 3', [post.id, post.category]);
  res.json({ ...post, related });
}));

r.get('/projects', ah(async (req, res) => {
  res.json(await many('SELECT * FROM projects ORDER BY featured DESC, year DESC NULLS LAST, id DESC'));
}));

r.get('/projects/:slug', ah(async (req, res) => {
  const p = await one('SELECT * FROM projects WHERE slug=$1', [req.params.slug]);
  if (!p) throw new HttpError(404, 'Projet introuvable');
  res.json(p);
}));

r.post('/contact', formLimiter, ah(async (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};
  if (!name?.trim() || !emailOk(email) || !message?.trim()) throw new HttpError(400, 'Nom, email et message sont requis');
  await q('INSERT INTO messages (name,email,phone,subject,message) VALUES ($1,$2,$3,$4,$5)', [name, email, phone || null, subject || null, message]);
  await sendMail(email, 'Nous avons bien reçu votre message', `Bonjour ${name},\n\nMerci pour votre message. Notre équipe vous répond rapidement.\n\nPERFEKT AGENCY`);
  res.status(201).json({ ok: true });
}));

r.post('/quotes', formLimiter, ah(async (req, res) => {
  const { name, email, phone, company, service, budget, message } = req.body || {};
  if (!name?.trim() || !emailOk(email)) throw new HttpError(400, 'Nom et email valides requis');
  await q('INSERT INTO quotes (name,email,phone,company,service,budget,message) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [name, email, phone || null, company || null, service || null, budget || null, message || null]);
  await sendMail(email, 'Votre demande de devis — PERFEKT AGENCY', `Bonjour ${name},\n\nNous avons bien reçu votre demande de devis (${service || 'service'}). Réponse sous 24 à 48 h ouvrées.`);
  res.status(201).json({ ok: true });
}));

r.post('/newsletter', formLimiter, ah(async (req, res) => {
  const { email } = req.body || {};
  if (!emailOk(email)) throw new HttpError(400, 'Email invalide');
  await q('INSERT INTO newsletter (email) VALUES (lower($1)) ON CONFLICT (email) DO NOTHING', [email]);
  res.status(201).json({ ok: true });
}));

// Vérification publique d'une attestation (QR code)
r.get('/certificates/verify/:number', ah(async (req, res) => {
  const c = await one(
    `SELECT ce.number, ce.score, ce.issued_at, ce.signature, ce.revoked, u.name, co.title AS course, co.duration_hours
     FROM certificates ce JOIN users u ON u.id=ce.user_id JOIN courses co ON co.id=ce.course_id WHERE ce.number=$1`,
    [req.params.number.toUpperCase()]);
  if (!c) throw new HttpError(404, 'Aucune attestation ne correspond à ce numéro');
  await logActivity(req, 'certificate_verified', { number: c.number });
  res.json({ ...c, valid: !c.revoked });
}));

export default r;

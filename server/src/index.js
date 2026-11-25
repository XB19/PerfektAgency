import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { many } from './db/pool.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import learnRoutes from './routes/learn.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import { startJobs } from './jobs.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET manquant dans server/.env');
  process.exit(1);
}

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' }, contentSecurityPolicy: false }));
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '1mb' }));

// Protection contre la force brute
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Trop de tentatives, réessayez dans 15 minutes.' } }));
app.use('/api/auth/forgot', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Trop de demandes.' } }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 600 }));

// Seules les images téléversées sont publiques
app.use('/uploads', (req, res, next) => (/\.(png|jpe?g|webp|gif|svg)$/i.test(req.path) ? next() : res.status(404).end()),
  express.static(path.resolve('uploads'), { maxAge: '30d' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api', learnRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// SEO : sitemap et robots
app.get(['/sitemap.xml', '/api/sitemap.xml'], async (req, res, next) => {
  try {
    const statics = ['', '/a-propos', '/services', '/portfolio', '/formations', '/blog', '/contact', '/devis'];
    const courses = await many('SELECT slug, created_at FROM courses WHERE published');
    const posts = await many('SELECT slug, created_at FROM posts WHERE published');
    const projects = await many('SELECT slug FROM projects');
    const url = (loc, lastmod) => `<url><loc>${CLIENT_URL}${loc}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`;
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...statics.map((s) => url(s)), ...courses.map((c) => url(`/formations/${c.slug}`, c.created_at)),
  ...posts.map((p) => url(`/blog/${p.slug}`, p.created_at)), ...projects.map((p) => url(`/portfolio/${p.slug}`))].join('\n')}
</urlset>`);
  } catch (e) { next(e); }
});
app.get(['/robots.txt', '/api/robots.txt'], (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /compte\nDisallow: /apprendre\nDisallow: /api/\nSitemap: ${CLIENT_URL}/sitemap.xml\n`);
});

// En production : servir le build React
const dist = path.resolve('../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '7d', index: false }));
  app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Route introuvable' }));
app.use((err, req, res, next) => {
  const status = err.status || (err.code === '23505' ? 409 : err.code === '22P02' ? 400 : 500);
  if (status >= 500) console.error(err);
  const message = err.code === '23505' ? 'Cet élément existe déjà (doublon)' : status >= 500 ? 'Erreur serveur' : err.message;
  if (!res.headersSent) res.status(status).json({ error: message });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`✅ API PERFEKT démarrée sur http://localhost:${PORT}`);
  startJobs();
});

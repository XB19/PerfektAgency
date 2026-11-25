import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { one, q } from './db/pool.js';

export const JWT_SECRET = process.env.JWT_SECRET;

export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 160);

export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const clientIp = (req) => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();

export async function logActivity(req, action, meta = {}, userId) {
  try {
    await q('INSERT INTO activity_log (user_id,action,meta,ip) VALUES ($1,$2,$3,$4)', [userId ?? req.user?.id ?? null, action, meta, clientIp(req)]);
  } catch { /* le journal ne doit jamais bloquer une requête */ }
}

export async function notify(userId, title, body, link) {
  await q('INSERT INTO notifications (user_id,title,body,link) VALUES ($1,$2,$3,$4)', [userId, title, body, link || null]);
}

// Emails automatiques : en production, brancher un SMTP (nodemailer, Brevo, Mailjet...).
// En développement, les emails sont affichés dans la console du serveur.
export async function sendMail(to, subject, text) {
  console.log(`\n📧  Email → ${to}\n    Objet : ${subject}\n    ${text.replace(/\n/g, '\n    ')}\n`);
}

export function signToken(user, sid) {
  return jwt.sign({ id: user.id, role: user.role, sid }, JWT_SECRET, { expiresIn: '7d' });
}

// Authentification : JWT + session en base (limite d'appareils, déconnexion à distance)
export const auth = (required = true) => ah(async (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) {
    if (required) throw new HttpError(401, 'Authentification requise');
    return next();
  }
  let payload;
  try { payload = jwt.verify(token, JWT_SECRET); } catch {
    if (required) throw new HttpError(401, 'Session expirée, veuillez vous reconnecter');
    return next();
  }
  const s = await one(
    `SELECT s.id, u.id AS uid, u.name, u.email, u.role, u.is_active, u.avatar_url
     FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 AND u.id=$2`,
    [payload.sid, payload.id]
  );
  if (!s || !s.is_active) {
    if (required) throw new HttpError(401, 'Session fermée (connexion depuis un autre appareil ?)');
    return next();
  }
  q('UPDATE sessions SET last_seen=now() WHERE id=$1', [s.id]).catch(() => {});
  req.user = { id: s.uid, name: s.name, email: s.email, role: s.role, sid: s.id };
  next();
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new HttpError(403, 'Accès refusé'));
  next();
};

export function certSignature(number, userId, courseId, score) {
  return crypto.createHmac('sha256', JWT_SECRET).update(`${number}|${userId}|${courseId}|${score}`).digest('hex').slice(0, 32).toUpperCase();
}

export const effectivePrice = (c) => (c.promo_price != null && c.promo_price < c.price ? c.promo_price : c.price);

export const fcfa = (n) => new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ') + ' FCFA';

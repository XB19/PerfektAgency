import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { one, q, many } from '../db/pool.js';
import { ah, auth, HttpError, signToken, clientIp, logActivity, sendMail, notify } from '../lib.js';

const r = Router();
const MAX_DEVICES = Number(process.env.MAX_DEVICES || 2);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, country: u.country, city: u.city, bio: u.bio, avatar_url: u.avatar_url, created_at: u.created_at });

async function openSession(req, user) {
  const device = String(req.headers['user-agent'] || 'Appareil inconnu').slice(0, 250);
  const s = await one('INSERT INTO sessions (user_id,device,ip) VALUES ($1,$2,$3) RETURNING id', [user.id, device, clientIp(req)]);
  // Limitation du nombre d'appareils : on ferme les sessions les plus anciennes
  await q(
    `DELETE FROM sessions WHERE user_id=$1 AND id NOT IN (
       SELECT id FROM sessions WHERE user_id=$1 ORDER BY last_seen DESC LIMIT $2)`,
    [user.id, user.role === 'admin' ? 10 : MAX_DEVICES]
  );
  return signToken(user, s.id);
}

r.post('/register', ah(async (req, res) => {
  const { name, email, password, phone } = req.body || {};
  if (!name?.trim() || !emailOk(email)) throw new HttpError(400, 'Nom et email valides requis');
  if (!password || password.length < 8) throw new HttpError(400, 'Le mot de passe doit contenir au moins 8 caractères');
  const exists = await one('SELECT id FROM users WHERE lower(email)=lower($1)', [email]);
  if (exists) throw new HttpError(409, 'Un compte existe déjà avec cet email');
  const user = await one(
    'INSERT INTO users (name,email,password_hash,phone) VALUES ($1,lower($2),$3,$4) RETURNING *',
    [name.trim(), email.trim(), await bcrypt.hash(password, 10), phone || null]
  );
  const token = await openSession(req, user);
  await notify(user.id, 'Bienvenue sur PERFEKT Academy ✨', 'Votre compte est prêt. Découvrez nos formations.', '/formations');
  await sendMail(user.email, 'Bienvenue chez PERFEKT Academy', `Bonjour ${user.name},\n\nVotre compte a bien été créé. Bonne formation !`);
  await logActivity(req, 'register', {}, user.id);
  res.status(201).json({ token, user: publicUser(user) });
}));

r.post('/login', ah(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await one('SELECT * FROM users WHERE lower(email)=lower($1)', [email || '']);
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    await logActivity(req, 'login_failed', { email });
    throw new HttpError(401, 'Email ou mot de passe incorrect');
  }
  if (!user.is_active) throw new HttpError(403, 'Compte désactivé. Contactez le support.');
  const token = await openSession(req, user);
  await logActivity(req, 'login', {}, user.id);
  res.json({ token, user: publicUser(user) });
}));

r.post('/logout', auth(), ah(async (req, res) => {
  await q('DELETE FROM sessions WHERE id=$1', [req.user.sid]);
  res.json({ ok: true });
}));

r.get('/me', auth(), ah(async (req, res) => {
  const u = await one('SELECT * FROM users WHERE id=$1', [req.user.id]);
  res.json({ user: publicUser(u) });
}));

r.put('/me', auth(), ah(async (req, res) => {
  const { name, phone, country, city, bio, avatar_url } = req.body || {};
  if (avatar_url && avatar_url.length > 400_000) throw new HttpError(400, 'Image trop lourde (max ~300 Ko)');
  const u = await one(
    `UPDATE users SET name=COALESCE(NULLIF($1,''),name), phone=$2, country=$3, city=$4, bio=$5, avatar_url=COALESCE($6,avatar_url)
     WHERE id=$7 RETURNING *`,
    [name, phone || null, country || null, city || null, bio || null, avatar_url || null, req.user.id]
  );
  res.json({ user: publicUser(u) });
}));

r.put('/password', auth(), ah(async (req, res) => {
  const { current, next } = req.body || {};
  const u = await one('SELECT * FROM users WHERE id=$1', [req.user.id]);
  if (!(await bcrypt.compare(current || '', u.password_hash))) throw new HttpError(400, 'Mot de passe actuel incorrect');
  if (!next || next.length < 8) throw new HttpError(400, 'Nouveau mot de passe trop court (8 caractères min.)');
  await q('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(next, 10), u.id]);
  await q('DELETE FROM sessions WHERE user_id=$1 AND id<>$2', [u.id, req.user.sid]);
  await logActivity(req, 'password_changed');
  res.json({ ok: true });
}));

r.post('/forgot', ah(async (req, res) => {
  const { email } = req.body || {};
  const u = await one('SELECT * FROM users WHERE lower(email)=lower($1)', [email || '']);
  let devResetUrl;
  if (u) {
    const token = crypto.randomBytes(32).toString('hex');
    await q("UPDATE users SET reset_token=$1, reset_expires=now() + interval '1 hour' WHERE id=$2",
      [crypto.createHash('sha256').update(token).digest('hex'), u.id]);
    const url = `${process.env.CLIENT_URL}/reinitialiser?token=${token}`;
    await sendMail(u.email, 'Réinitialisation de votre mot de passe', `Cliquez sur ce lien (valable 1 h) :\n${url}`);
    if (process.env.NODE_ENV !== 'production') devResetUrl = url;
  }
  // Réponse identique que le compte existe ou non (pas d'énumération d'emails)
  res.json({ ok: true, devResetUrl });
}));

r.post('/reset', ah(async (req, res) => {
  const { token, password } = req.body || {};
  if (!password || password.length < 8) throw new HttpError(400, 'Mot de passe trop court (8 caractères min.)');
  const hash = crypto.createHash('sha256').update(token || '').digest('hex');
  const u = await one('SELECT id FROM users WHERE reset_token=$1 AND reset_expires > now()', [hash]);
  if (!u) throw new HttpError(400, 'Lien invalide ou expiré');
  await q('UPDATE users SET password_hash=$1, reset_token=NULL, reset_expires=NULL WHERE id=$2', [await bcrypt.hash(password, 10), u.id]);
  await q('DELETE FROM sessions WHERE user_id=$1', [u.id]);
  await logActivity(req, 'password_reset', {}, u.id);
  res.json({ ok: true });
}));

r.get('/sessions', auth(), ah(async (req, res) => {
  const rows = await many('SELECT id, device, ip, created_at, last_seen FROM sessions WHERE user_id=$1 ORDER BY last_seen DESC', [req.user.id]);
  res.json(rows.map((s) => ({ ...s, current: s.id === req.user.sid })));
}));

r.delete('/sessions/:id', auth(), ah(async (req, res) => {
  await q('DELETE FROM sessions WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

export default r;

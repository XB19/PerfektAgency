/*
 * Paiements PERFEKT Academy
 * -------------------------
 * Moyens : carte bancaire, Flooz (Moov Money), Mixx by Yas, paiement international.
 * Mode actuel : SIMULATION (PAYMENT_MODE=simulation) — la confirmation est déclenchée par l'utilisateur
 * pour tester le parcours complet (validation automatique, inscription, facture, reçu).
 * En production : remplacer `startProviderPayment` par l'appel API du prestataire (PayGate Global, FedaPay,
 * CinetPay, Stripe…) et valider la commande dans la route webhook après vérification de la signature.
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import { one, q, tx } from '../db/pool.js';
import { ah, auth, HttpError, effectivePrice, logActivity, notify, sendMail, fcfa } from '../lib.js';

const r = Router();
const METHODS = ['card', 'flooz', 'mixx', 'international'];

async function couponFor(code) {
  if (!code) return null;
  const c = await one(
    `SELECT * FROM coupons WHERE upper(code)=upper($1) AND active AND (expires_at IS NULL OR expires_at > now())
       AND (max_uses IS NULL OR used < max_uses)`, [code.trim()]);
  if (!c) throw new HttpError(400, 'Code promo invalide ou expiré');
  return c;
}

r.post('/coupon', auth(), ah(async (req, res) => {
  const course = await one('SELECT * FROM courses WHERE id=$1', [req.body?.courseId]);
  if (!course) throw new HttpError(404, 'Formation introuvable');
  const c = await couponFor(req.body?.code);
  const base = effectivePrice(course);
  res.json({ code: c.code, percent: c.percent, amount: Math.round(base * (1 - c.percent / 100)) });
}));

async function markPaid(client, order) {
  await client.query("UPDATE orders SET status='paid', paid_at=now() WHERE id=$1", [order.id]);
  await client.query('INSERT INTO enrollments (user_id,course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [order.user_id, order.course_id]);
  if (order.coupon_code) await client.query('UPDATE coupons SET used=used+1 WHERE upper(code)=upper($1)', [order.coupon_code]);
}

async function afterPaid(req, order) {
  const course = await one('SELECT title, slug FROM courses WHERE id=$1', [order.course_id]);
  const user = await one('SELECT name, email FROM users WHERE id=$1', [order.user_id]);
  await notify(order.user_id, 'Paiement confirmé ✅', `Votre accès à « ${course.title} » est activé.`, `/apprendre/${course.slug}`);
  await sendMail(user.email, `Reçu de paiement ${order.reference}`, `Bonjour ${user.name},\n\nPaiement de ${fcfa(order.amount)} confirmé pour « ${course.title} ».\nVotre facture est disponible dans votre espace (Historique des achats).`);
  await logActivity(req, 'payment_paid', { reference: order.reference, amount: order.amount }, order.user_id);
}

r.post('/checkout', auth(), ah(async (req, res) => {
  const { courseId, method, phone, coupon } = req.body || {};
  if (!METHODS.includes(method)) throw new HttpError(400, 'Moyen de paiement invalide');
  if (['flooz', 'mixx'].includes(method) && !/^\+?\d[\d\s]{7,}$/.test(phone || '')) throw new HttpError(400, 'Numéro Mobile Money invalide');
  const course = await one('SELECT * FROM courses WHERE id=$1 AND published', [courseId]);
  if (!course) throw new HttpError(404, 'Formation introuvable');
  if (await one('SELECT 1 FROM enrollments WHERE user_id=$1 AND course_id=$2', [req.user.id, course.id])) throw new HttpError(409, 'Vous êtes déjà inscrit à cette formation');

  const base = effectivePrice(course);
  const cp = await couponFor(coupon);
  const amount = cp ? Math.round(base * (1 - cp.percent / 100)) : base;
  const reference = `PA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const order = await one(
    `INSERT INTO orders (reference,user_id,course_id,original_amount,amount,coupon_code,method,phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [reference, req.user.id, course.id, base, amount, cp?.code || null, method, phone || null]);
  await logActivity(req, 'checkout', { reference, method, amount });

  if (amount === 0) {
    await tx((c) => markPaid(c, order));
    await afterPaid(req, order);
    return res.json({ reference, status: 'paid', amount });
  }
  res.json({
    reference, status: 'pending', amount, method,
    instructions: ['flooz', 'mixx'].includes(method)
      ? `Une demande de paiement de ${fcfa(amount)} va être envoyée au ${phone}. Validez-la avec votre code secret ${method === 'flooz' ? 'Flooz' : 'Mixx by Yas'}.`
      : `Vous allez être redirigé vers la page sécurisée de paiement par carte (${fcfa(amount)}).`,
  });
}));

// Confirmation (simulation du retour prestataire / webhook)
r.post('/:ref/confirm', auth(), ah(async (req, res) => {
  const order = await one('SELECT * FROM orders WHERE reference=$1 AND user_id=$2', [req.params.ref, req.user.id]);
  if (!order) throw new HttpError(404, 'Commande introuvable');
  if (order.status === 'paid') return res.json({ status: 'paid' });
  if (process.env.PAYMENT_MODE && process.env.PAYMENT_MODE !== 'simulation') throw new HttpError(400, 'Confirmation manuelle désactivée en production');
  if (req.body?.cancel) {
    await q("UPDATE orders SET status='failed' WHERE id=$1", [order.id]);
    return res.json({ status: 'failed' });
  }
  await tx((c) => markPaid(c, order));
  await afterPaid(req, order);
  res.json({ status: 'paid' });
}));

r.get('/:ref', auth(), ah(async (req, res) => {
  const o = await one('SELECT o.*, c.title, c.slug FROM orders o JOIN courses c ON c.id=o.course_id WHERE o.reference=$1 AND o.user_id=$2', [req.params.ref, req.user.id]);
  if (!o) throw new HttpError(404, 'Commande introuvable');
  res.json(o);
}));

// Webhook prestataire (à activer en production : vérifier la signature HMAC fournie par le prestataire)
r.post('/webhook/:provider', ah(async (req, res) => {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) throw new HttpError(503, 'Webhook non configuré');
  const sig = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
  if (sig !== req.headers['x-signature']) throw new HttpError(401, 'Signature invalide');
  const order = await one('SELECT * FROM orders WHERE reference=$1', [req.body?.reference]);
  if (order && order.status !== 'paid' && req.body?.status === 'success') {
    await tx((c) => markPaid(c, order));
    await afterPaid(req, order);
  }
  res.json({ received: true });
}));

export default r;

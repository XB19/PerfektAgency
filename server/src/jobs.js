// Tâches automatiques : relances des apprenants inactifs, relance des paniers abandonnés, sauvegardes.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { many, q } from './db/pool.js';
import { notify, sendMail } from './lib.js';

async function remindInactiveLearners() {
  const rows = await many(`
    SELECT e.user_id, u.email, u.name, c.title, c.slug FROM enrollments e
    JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id
    WHERE e.completed_at IS NULL AND e.created_at < now() - interval '7 days'
      AND NOT EXISTS (SELECT 1 FROM lesson_progress lp JOIN lessons l ON l.id=lp.lesson_id JOIN modules m ON m.id=l.module_id
                      WHERE m.course_id=c.id AND lp.user_id=e.user_id AND lp.updated_at > now() - interval '7 days')
      AND NOT EXISTS (SELECT 1 FROM activity_log a WHERE a.user_id=e.user_id AND a.action='reminder_inactive'
                      AND a.meta->>'course'=c.slug AND a.created_at > now() - interval '7 days')`);
  for (const r of rows) {
    await notify(r.user_id, 'On vous attend ! 📚', `Reprenez « ${r.title} » là où vous vous étiez arrêté.`, `/apprendre/${r.slug}`);
    await sendMail(r.email, `Reprenez votre formation « ${r.title} »`, `Bonjour ${r.name},\nVotre progression est sauvegardée : reprenez en un clic depuis votre espace.`);
    await q("INSERT INTO activity_log (user_id,action,meta) VALUES ($1,'reminder_inactive',$2)", [r.user_id, { course: r.slug }]);
  }
}

async function remindPendingOrders() {
  const rows = await many(`
    SELECT o.id, o.user_id, u.email, u.name, c.title, c.slug FROM orders o JOIN users u ON u.id=o.user_id JOIN courses c ON c.id=o.course_id
    WHERE o.status='pending' AND o.created_at < now() - interval '1 day' AND o.created_at > now() - interval '3 days'
      AND NOT EXISTS (SELECT 1 FROM activity_log a WHERE a.action='reminder_order' AND (a.meta->>'order')::int=o.id)`);
  for (const r of rows) {
    await notify(r.user_id, 'Votre inscription vous attend', `Finalisez votre paiement pour « ${r.title} ».`, `/formations/${r.slug}`);
    await sendMail(r.email, 'Finalisez votre inscription', `Bonjour ${r.name},\nVotre commande pour « ${r.title} » est en attente de paiement.`);
    await q("INSERT INTO activity_log (user_id,action,meta) VALUES ($1,'reminder_order',$2)", [r.user_id, { order: r.id }]);
  }
}

export function backup() {
  const bin = process.env.PG_DUMP || 'pg_dump';
  const dir = path.resolve(process.env.BACKUP_DIR || 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `perfekt-${new Date().toISOString().slice(0, 10)}.dump`);
  return new Promise((resolve) => {
    // Le mot de passe passe par l'environnement (PGPASSWORD), jamais par la ligne de commande
    const p = spawn(bin, ['-Fc', '-f', file, process.env.PGDATABASE], { env: process.env });
    p.on('error', (e) => { console.warn('Sauvegarde impossible :', e.message, '(définissez PG_DUMP dans .env)'); resolve(false); });
    p.on('close', (code) => {
      if (code === 0) {
        console.log('💾 Sauvegarde créée :', file);
        // Rotation : on garde les 14 dernières
        fs.readdirSync(dir).filter((f) => f.endsWith('.dump')).sort().slice(0, -14).forEach((f) => fs.unlinkSync(path.join(dir, f)));
      }
      resolve(code === 0);
    });
  });
}

export function startJobs() {
  const run = async () => {
    try { await remindInactiveLearners(); await remindPendingOrders(); } catch (e) { console.warn('Relances :', e.message); }
  };
  setTimeout(run, 10_000);
  setInterval(run, 6 * 60 * 60 * 1000);
  if (process.env.AUTO_BACKUP !== 'false') {
    setTimeout(backup, 30_000);
    setInterval(backup, 24 * 60 * 60 * 1000);
  }
}

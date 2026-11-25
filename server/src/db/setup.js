// Crée la base si besoin, applique le schéma et insère les données de démonstration.
// Usage : npm run db:setup          (ajoute --reset pour tout réinitialiser)
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { seed } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbName = process.env.PGDATABASE;
const base = {
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
};

async function main() {
  const admin = new pg.Client({ ...base, database: 'postgres' });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [dbName]);
  if (process.argv.includes('--reset') && exists.rowCount) {
    await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()`, [dbName]);
    await admin.query(`DROP DATABASE "${dbName}"`);
    console.log(`Base ${dbName} supprimée.`);
  }
  const again = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [dbName]);
  if (!again.rowCount) {
    await admin.query(`CREATE DATABASE "${dbName}" ENCODING 'UTF8'`);
    console.log(`Base ${dbName} créée.`);
  }
  await admin.end();

  const client = new pg.Client({ ...base, database: dbName });
  await client.connect();
  await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  console.log('Schéma appliqué.');
  const { rows } = await client.query('SELECT count(*)::int AS n FROM users');
  if (rows[0].n === 0) {
    await seed(client);
    console.log('Données de démonstration insérées.');
  } else {
    console.log('Données déjà présentes — seed ignoré.');
  }
  await client.end();
}

main().catch((e) => {
  console.error('Erreur setup :', e.message);
  process.exit(1);
});

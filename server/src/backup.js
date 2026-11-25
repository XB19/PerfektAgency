// Sauvegarde manuelle : npm run backup
import 'dotenv/config';
import { backup } from './jobs.js';
const ok = await backup();
process.exit(ok ? 0 : 1);

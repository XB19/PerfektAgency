// Lance l'API (port 4000) et le site React (port 5173) en parallèle
import { spawn } from 'node:child_process';
const run = (name, cwd, args) => {
  const p = spawn('npm', args, { cwd, shell: true, stdio: 'pipe' });
  p.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`));
  p.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`));
  return p;
};
const procs = [run('api', 'server', ['run', 'dev']), run('web', 'client', ['run', 'dev'])];
process.on('SIGINT', () => { procs.forEach((p) => p.kill()); process.exit(); });

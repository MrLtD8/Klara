/**
 * dev.js — startar hela den lokala testmiljön med ett kommando.
 *
 *   npm run dev
 *
 * Kör två processer samtidigt:
 *   • api → ha-addon/server.js på port 3001 (iCal-proxy + datasynk)
 *   • web → CRA dev-server på port 3000 med hot reload
 *
 * CRA proxar /api/* till 3001 (se "proxy" i package.json). Öppna
 * http://localhost:3000. Ctrl+C stänger båda. Inga extra beroenden behövs.
 */
const { spawn } = require('child_process');

const procs = [
  { name: 'api', cmd: 'node dev-api.js' },
  { name: 'web', cmd: 'npm start' },
];

const children = procs.map(({ name, cmd }) => {
  const child = spawn(cmd, { stdio: 'inherit', shell: true });
  child.on('exit', code => {
    console.log(`\n[dev] "${name}" avslutades (kod ${code}). Stänger allt.`);
    shutdown();
  });
  return child;
});

let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  for (const c of children) { try { c.kill(); } catch {} }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

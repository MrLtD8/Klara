/**
 * dev-serve.js — Lokal "produktionsmiljö" som speglar HA.
 *
 * Serverar det byggda React-bygget (build/) genom EXAKT samma server som HA
 * kör, på port 3000 med en lokal datafil. Använd som sista koll innan deploy:
 *
 *   npm run preview:local     (bygger först, sedan serverar)
 *
 * Skillnad mot `npm run dev`: ingen hot reload, men 1:1 med hur HA beter sig
 * (samma statiska servering, SPA-fallback och API:er i en och samma process).
 */
const path = require('path');

process.env.PORT = process.env.PORT || '3000';
process.env.PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, 'build');
process.env.DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '.devdata', 'familjeapp.json');

console.log(`[dev-serve] serverar build/ på http://localhost:${process.env.PORT} (speglar HA)`);
console.log(`[dev-serve] datafil: ${process.env.DATA_FILE}`);

require('./ha-addon/server.js');

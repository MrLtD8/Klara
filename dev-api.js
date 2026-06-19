/**
 * dev-api.js — Lokal API-server för utveckling.
 *
 * Kör EXAKT samma kod som HA-addonet (ha-addon/server.js), men på port 3001
 * och med en lokal datafil (.devdata/). CRA:s dev-server på port 3000 proxar
 * /api/*-anrop hit (se "proxy" i package.json), så iCal-kalendern (/api/calendar)
 * och datasynken (/api/data) fungerar lokalt precis som på HA.
 *
 * Startas av `npm run dev` tillsammans med CRA, eller separat med `npm run dev:api`.
 */
const path = require('path');

process.env.PORT = process.env.PORT || '3001';
process.env.DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '.devdata', 'familjeapp.json');

console.log(`[dev-api] startar API på http://localhost:${process.env.PORT}`);
console.log(`[dev-api] datafil: ${process.env.DATA_FILE}`);
console.log('[dev-api] tips: kopiera HA:s familjeapp.json hit för att testa mot riktig data.');

require('./ha-addon/server.js');

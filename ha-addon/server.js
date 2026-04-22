/**
 * FamiljePlan — Lokal server för Animus Heart / Home Assistant
 *
 * Gör två saker:
 *   1. Serverar den byggda React-appen som statiska filer
 *   2. Erbjuder ett enkelt REST-API (/api/data) som läser och
 *      skriver all appdata till en JSON-fil på enheten
 *
 * Alla enheter på samma nätverk som pratar med samma server
 * delar automatiskt samma data — ingen moln-tjänst behövs.
 *
 * Data sparas i: /data/familjeapp.json  (HA:s persistenta datamapp)
 * Port:          3000 (konfigurerbar via env PORT)
 */

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app       = express();
const PORT      = process.env.PORT      || 3000;
const DATA_FILE = process.env.DATA_FILE || '/data/familjeapp.json';
const PUBLIC    = path.join(__dirname, 'public');

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// Tillåt anrop från alla enheter på lokalt nätverk
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── API: hämta all appdata ────────────────────────────────────
app.get('/api/data', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      res.json(JSON.parse(raw));
    } else {
      res.json({});
    }
  } catch (e) {
    console.error('[familjeapp] Läsfel:', e.message);
    res.json({});
  }
});

// ── API: spara all appdata ────────────────────────────────────
app.post('/api/data', (req, res) => {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    console.error('[familjeapp] Skrivfel:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Statiska filer (React-bygget) ─────────────────────────────
app.use(express.static(PUBLIC));

// SPA-fallback — injicera <base>-tag så HA Ingress-sökvägen fungerar
app.get('*', (req, res) => {
  const ingressPath = req.headers['x-ingress-path'] || '';
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  const patched = html.replace('<head>', `<head><base href="${ingressPath}/">`);
  res.setHeader('Content-Type', 'text/html');
  res.send(patched);
});

// ── Starta ───────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  FamiljePlan kör på http://0.0.0.0:${PORT}`);
  console.log(`📁  Data sparas i: ${DATA_FILE}`);
});

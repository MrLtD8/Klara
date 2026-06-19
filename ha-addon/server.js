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
const PORT      = process.env.PORT       || 3000;
const DATA_FILE = process.env.DATA_FILE  || '/data/familjeapp.json';
const PUBLIC    = process.env.PUBLIC_DIR || path.join(__dirname, 'public');

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

// ── ICS-hjälpfunktioner (för Google Kalender-synk) ─────────────
function unfoldLines(text) {
  return text.replace(/\r\n/g, '\n').split('\n').reduce((lines, line) => {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
    return lines;
  }, []);
}

function parseIcsDate(value) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function dateOnly(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAY_NUM = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/**
 * Expanderar en VEVENT till konkreta datum inom [windowStart, windowEnd], med
 * hänsyn till RRULE (FREQ/INTERVAL/COUNT/UNTIL/BYDAY) och EXDATE. Detta gör att
 * avslutade serier (UNTIL/COUNT) faktiskt slutar visas — istället för att en
 * "weekly"-flagga matchas i all oändlighet på klienten.
 */
function expandDates(raw, windowStart, windowEnd) {
  const out = [];
  if (!raw.dtstart) return out;
  const start = new Date(raw.dtstart + 'T12:00:00');
  if (isNaN(start.getTime())) return out;
  const ex = raw.exdates || new Set();

  // Ej återkommande → en enda instans, filtrerad mot fönstret.
  if (!raw.rrule || !raw.rrule.FREQ) {
    if (start >= windowStart && start <= windowEnd && !ex.has(raw.dtstart)) out.push(raw.dtstart);
    return out;
  }

  const rr = raw.rrule;
  const freq = rr.FREQ;
  const interval = Math.max(1, parseInt(rr.INTERVAL || '1', 10) || 1);
  const count = rr.COUNT ? parseInt(rr.COUNT, 10) : null;
  const until = rr.UNTIL ? new Date((parseIcsDate(rr.UNTIL) || '9999-12-31') + 'T23:59:59') : null;
  let emitted = 0;            // räknar instanser från start (för COUNT)
  const SAFETY = 3000;

  // Lägger till ett kandidatdatum. Returnerar 'stop' när serien är slut.
  const tryDate = d => {
    if (until && d > until) return 'stop';
    if (count !== null && emitted >= count) return 'stop';
    if (d >= start) {
      emitted++;
      if (d > windowEnd) return 'stop';      // datum ökar monotont → klart
      if (d >= windowStart && !ex.has(dateOnly(d))) out.push(dateOnly(d));
    }
    return 'continue';
  };

  if (freq === 'WEEKLY') {
    const days = (rr.BYDAY
      ? rr.BYDAY.split(',').map(s => WEEKDAY_NUM[s.replace(/^[+-]?\d+/, '')]).filter(n => n !== undefined)
      : [start.getDay()]).sort((a, b) => a - b);
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // tillbaka till söndag
    for (let i = 0; i < SAFETY; i++) {
      let stop = false;
      for (const wd of days) {
        const d = new Date(weekStart); d.setDate(d.getDate() + wd);
        if (tryDate(d) === 'stop') { stop = true; break; }
      }
      if (stop) break;
      weekStart.setDate(weekStart.getDate() + 7 * interval);
    }
  } else if (freq === 'DAILY') {
    const d = new Date(start);
    for (let i = 0; i < SAFETY; i++) { if (tryDate(new Date(d)) === 'stop') break; d.setDate(d.getDate() + interval); }
  } else if (freq === 'MONTHLY') {
    const d = new Date(start);
    for (let i = 0; i < 600; i++) { if (tryDate(new Date(d)) === 'stop') break; d.setMonth(d.getMonth() + interval); }
  } else if (freq === 'YEARLY') {
    const d = new Date(start);
    for (let i = 0; i < 300; i++) { if (tryDate(new Date(d)) === 'stop') break; d.setFullYear(d.getFullYear() + interval); }
  } else if (start >= windowStart && start <= windowEnd && !ex.has(raw.dtstart)) {
    out.push(raw.dtstart); // okänd FREQ → bara startdatumet
  }
  return out;
}

function parseIcsEvents(text) {
  const lines = unfoldLines(text);
  const events = [];
  let cur = null;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const windowStart = new Date(today); windowStart.setDate(windowStart.getDate() - 7);
  const windowEnd = new Date(today); windowEnd.setDate(windowEnd.getDate() + 180);

  function flush(raw) {
    if (!raw || !raw.dtstart) return;
    const uid = raw.uid || Math.random().toString(36).slice(2);
    for (const date of expandDates(raw, windowStart, windowEnd)) {
      events.push({
        id: 'gcal_' + uid + '_' + date,   // unikt per instans
        type: 'gcal',
        title: raw.summary || 'Händelse',
        who: '',
        date,
        recur: 'none',                     // expanderat → konkreta datum
      });
    }
  }

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') { flush(cur); cur = null; continue; }
    if (!cur) continue;

    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const name = key.split(';')[0];

    if (name === 'SUMMARY') cur.summary = value.replace(/\\,/g, ',').replace(/\\n/gi, ' ');
    else if (name === 'UID') cur.uid = value;
    else if (name === 'DTSTART') cur.dtstart = parseIcsDate(value);
    else if (name === 'EXDATE') {
      cur.exdates = cur.exdates || new Set();
      value.split(',').forEach(v => { const d = parseIcsDate(v); if (d) cur.exdates.add(d); });
    }
    else if (name === 'RRULE') {
      cur.rrule = {};
      value.split(';').forEach(part => { const [k, v] = part.split('='); cur.rrule[k] = v; });
    }
  }
  return events;
}

// ── API: hämta Google Kalender via hemlig iCal-länk ────────────
app.get('/api/calendar', async (req, res) => {
  const icsUrl = req.query.url;
  if (!icsUrl) return res.status(400).json({ error: 'Ingen URL angiven' });
  try {
    const response = await fetch(icsUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    res.json({ events: parseIcsEvents(text) });
  } catch (e) {
    console.error('[familjeapp] Kalenderfel:', e.message);
    res.status(502).json({ error: 'Kunde inte hämta kalendern: ' + e.message });
  }
});

// ── Statiska filer (React-bygget) ─────────────────────────────
app.use(express.static(PUBLIC));

// SPA-fallback — alla okända URL:er skickas till index.html.
// Vid lokal API-utveckling (dev-api.js) finns ingen byggd frontend här —
// svara då med en hjälptext istället för att kasta ENOENT.
app.get('*', (_req, res) => {
  const indexFile = path.join(PUBLIC, 'index.html');
  if (fs.existsSync(indexFile)) res.sendFile(indexFile);
  else res.status(404).send('Dev API-server — frontend körs separat (t.ex. http://localhost:3000).');
});

// ── Starta ───────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  FamiljePlan kör på http://0.0.0.0:${PORT}`);
  console.log(`📁  Data sparas i: ${DATA_FILE}`);
});

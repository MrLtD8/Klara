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

// ── Datahelpers ───────────────────────────────────────────────
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) { console.error('[familjeapp] Läsfel:', e.message); }
  return {};
}

function writeData(data) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Addon-inställningar (HA skriver /data/options.json) ──────
function loadOptions() {
  try {
    const p = path.join(path.dirname(DATA_FILE), 'options.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) { /* kör vidare med env-fallback */ }
  return {};
}

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

// ══════════════════════════════════════════════════════════════
//  Home Assistant-koppling
//
//  Addons med homeassistant_api: true får SUPERVISOR_TOKEN som env
//  och når HA:s Core API via http://supervisor/core/api — ingen
//  long-lived token behövs.
// ══════════════════════════════════════════════════════════════
const HA_API = process.env.HA_API_URL || 'http://supervisor/core/api';
const HA_TOKEN = process.env.SUPERVISOR_TOKEN || '';

async function haFetch(apiPath, opts = {}) {
  if (!HA_TOKEN) throw new Error('Ingen SUPERVISOR_TOKEN — kör vi utanför HA?');
  const res = await fetch(HA_API + apiPath, {
    ...opts,
    headers: { Authorization: `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`HA API ${res.status}`);
  return res.json();
}

// Status: är HA-API:t nåbart?
app.get('/api/ha/status', async (_req, res) => {
  try {
    const cfg = await haFetch('/config');
    res.json({ available: true, version: cfg.version, location: cfg.location_name });
  } catch (e) {
    res.json({ available: false, reason: e.message });
  }
});

// Lista entiteter (för att välja t.ex. dörrsensor i appen)
app.get('/api/ha/states', async (req, res) => {
  try {
    const states = await haFetch('/states');
    const q = (req.query.q || '').toLowerCase();
    const list = states
      .filter(s => !q || s.entity_id.toLowerCase().includes(q) || (s.attributes?.friendly_name || '').toLowerCase().includes(q))
      .slice(0, 200)
      .map(s => ({ entity_id: s.entity_id, state: s.state, name: s.attributes?.friendly_name || s.entity_id }));
    res.json({ states: list });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  Regelmotor — utvärderar kl_automations från appen
//
//  Regelformat (skapas i Klara → Automationer):
//    { id, name, trigger, triggerTime, condition, action, message, enabled }
//  Konfig:  data.kl_automation_config = { doorEntity: 'binary_sensor.xxx' }
//  Notiser: data.kl_notifications     = [{ id, time, ruleName, message, read }]
// ══════════════════════════════════════════════════════════════
const engineState = { firedToday: {}, lastFireDate: '', doorState: null, lastDoorFire: {} };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function checkCondition(cond, data) {
  const today = todayStr();
  const day = new Date().getDay();
  switch (cond) {
    case 'med_not_given': {
      const meds = data.kl_medicin || [];
      return meds.some(m => !m.lastGiven || m.lastGiven.slice(0, 10) !== today);
    }
    case 'task_not_done': return (data.kl_tasks || []).some(t => t.lane !== 'done');
    case 'no_cal_today':  return !(data.kl_events || []).some(e => e.date === today);
    case 'weekday':       return day >= 1 && day <= 5;
    case 'weekend':       return day === 0 || day === 6;
    default:              return true; // 'none'
  }
}

function pushNotification(data, rule) {
  data.kl_notifications = [
    { id: 'n_' + Date.now(), time: new Date().toISOString(), ruleName: rule.name, message: rule.message || rule.name, read: false },
    ...(data.kl_notifications || []),
  ].slice(0, 50);
}

async function fireAction(rule, data) {
  pushNotification(data, rule); // alla åtgärder loggas i appen
  if (rule.action === 'notify_push' || rule.action === 'sound') {
    const service = loadOptions().notify_service || 'notify';
    try {
      await haFetch(`/services/notify/${service}`, {
        method: 'POST',
        body: JSON.stringify({ title: '⚡ ' + rule.name, message: rule.message || rule.name }),
      });
    } catch (e) {
      console.error('[automation] Push-notis misslyckades:', e.message);
    }
  }
  console.log(`[automation] "${rule.name}" triggad (${rule.action})`);
}

async function engineTick() {
  const data = readData();
  const rules = (data.kl_automations || []).filter(r => r.enabled);
  if (!rules.length) return;

  const now = new Date();
  const today = todayStr();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Nollställ dagsräknaren vid midnatt
  if (engineState.lastFireDate !== today) {
    engineState.firedToday = {};
    engineState.lastFireDate = today;
  }

  // Dörrsensor: läs av en gång per tick om någon regel behöver den
  const doorEntity = data.kl_automation_config?.doorEntity;
  let doorOpened = false;
  if (doorEntity && rules.some(r => r.trigger === 'door')) {
    try {
      const st = await haFetch(`/states/${doorEntity}`);
      if (engineState.doorState === 'off' && st.state === 'on') doorOpened = true;
      engineState.doorState = st.state;
    } catch (e) { /* sensor onåbar — hoppa över denna tick */ }
  }

  let changed = false;
  for (const rule of rules) {
    let shouldFire = false;

    if (['time', 'morning', 'evening'].includes(rule.trigger)) {
      // Tidsbaserad: en gång per dag, inom 5 min efter angiven tid
      if (!engineState.firedToday[rule.id] && rule.triggerTime) {
        const [h, m] = rule.triggerTime.split(':').map(Number);
        const target = h * 60 + m;
        if (nowMin >= target && nowMin <= target + 5) shouldFire = true;
      }
    } else if (rule.trigger === 'door' && doorOpened) {
      // Dörr: max en gång per kvart per regel (debounce)
      const last = engineState.lastDoorFire[rule.id] || 0;
      if (Date.now() - last > 15 * 60 * 1000) {
        shouldFire = true;
        engineState.lastDoorFire[rule.id] = Date.now();
      }
    } else if (rule.trigger === 'cal_soon') {
      // Händelse idag: en gång per dag
      if (!engineState.firedToday[rule.id] && (data.kl_events || []).some(e => e.date === today)) shouldFire = true;
    }

    if (shouldFire && checkCondition(rule.condition, data)) {
      engineState.firedToday[rule.id] = true;
      await fireAction(rule, data);
      changed = true;
    } else if (shouldFire) {
      engineState.firedToday[rule.id] = true; // villkoret stoppade — prova inte igen idag
    }
  }
  if (changed) writeData(data);
}

setInterval(() => engineTick().catch(e => console.error('[automation] Tick-fel:', e.message)), 30 * 1000);

// ══════════════════════════════════════════════════════════════
//  AI-dagsrapport — Claude analyserar dagens läge
//
//  API-nyckel: addon-option anthropic_api_key, env ANTHROPIC_API_KEY
//  eller kl_claude_key i datafilen. Bara text skickas — inga namn
//  på tjänster utanför nätverket behöver mer än prompten.
// ══════════════════════════════════════════════════════════════
function getClaudeKey() {
  return loadOptions().anthropic_api_key || process.env.ANTHROPIC_API_KEY || readData().kl_claude_key || '';
}

app.post('/api/assistent/rapport', async (_req, res) => {
  const key = getClaudeKey();
  if (!key) return res.status(400).json({ error: 'Ingen Claude API-nyckel konfigurerad (addon-option anthropic_api_key).' });

  const data = readData();
  const today = todayStr();
  const dayName = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  const eventsToday = (data.kl_events || []).filter(e => e.date === today).map(e => e.title);
  const tasksOpen   = (data.kl_tasks  || []).filter(t => t.lane !== 'done').map(t => `${t.title} (${t.lane === 'progress' ? 'pågår' : 'att göra'}${t.prio === 'high' ? ', hög prio' : ''})`);
  const medsPending = (data.kl_medicin || []).filter(m => !m.lastGiven || m.lastGiven.slice(0, 10) !== today).map(m => m.name);

  const prompt = `Du är familjens assistent. Idag är det ${dayName}.

Händelser idag: ${eventsToday.length ? eventsToday.join(', ') : 'inga'}
Öppna uppgifter: ${tasksOpen.length ? tasksOpen.join('; ') : 'inga'}
Mediciner ej givna idag: ${medsPending.length ? medsPending.join(', ') : 'alla givna'}

Skriv en kort dagsrapport på svenska (max 4 meningar) och föreslå max 3 nya konkreta uppgifter om något verkar saknas. Svara med ENDAST giltig JSON:
{"sammanfattning": "...", "forslag": ["...", "..."]}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!resp.ok) throw new Error(`Claude API ${resp.status}`);
    const out = await resp.json();
    const text = out.content?.[0]?.text || '{}';
    const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));

    const insight = {
      id: 'ins_' + Date.now(),
      time: new Date().toISOString(),
      summary: parsed.sammanfattning || text,
      suggestions: Array.isArray(parsed.forslag) ? parsed.forslag : [],
    };
    data.kl_insights = [insight, ...(data.kl_insights || [])].slice(0, 20);
    writeData(data);
    res.json(insight);
  } catch (e) {
    console.error('[assistent] Rapportfel:', e.message);
    res.status(502).json({ error: 'AI-rapporten misslyckades: ' + e.message });
  }
});

app.get('/api/insights', (_req, res) => {
  res.json({ insights: readData().kl_insights || [] });
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

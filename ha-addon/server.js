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
      const meds = (data.kl_medicin || []).filter(m => m.active !== false);
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

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

/** Gemensamt Claude-anrop. Kastar Error om nyckel saknas eller API:t felar. */
async function callClaude(prompt, maxTokens = 500) {
  const key = getClaudeKey();
  if (!key) throw new Error('Ingen Claude API-nyckel konfigurerad (addon-option anthropic_api_key).');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) {
    // Anthropic skickar felorsaken i svarskroppen — ta med den (t.ex. "credit balance too low")
    const detail = await resp.text().then(t => { try { return JSON.parse(t).error?.message || t; } catch { return t; } }).catch(() => '');
    throw new Error(`Claude API ${resp.status}${detail ? ': ' + detail.slice(0, 200) : ''}`);
  }
  const out = await resp.json();
  return out.content?.[0]?.text || '';
}

/** Lokalt Ollama-anrop — kräver addon-option ollama_url (t.ex. http://192.168.50.244:11434). */
async function callOllama(prompt, { maxTokens = 500, json = false } = {}) {
  const opts = loadOptions();
  const url = (opts.ollama_url || '').replace(/\/+$/, '');
  const model = opts.ollama_model || 'llama3.2:3b';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 180 * 1000); // små modeller kan vara långsamma
  try {
    const resp = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, prompt, stream: false,
        ...(json ? { format: 'json' } : {}),
        options: { num_predict: maxTokens },
      }),
      signal: ctrl.signal,
    });
    if (!resp.ok) throw new Error(`Ollama ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 200)}`);
    const out = await resp.json();
    return out.response || '';
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`Ollama-anropet tog för lång tid (>${180}s) — är datorn med Ollama igång?`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** AI-växel: Ollama om ollama_url är satt, annars Claude API. */
async function callAI(prompt, { maxTokens = 500, json = false } = {}) {
  if (loadOptions().ollama_url) return callOllama(prompt, { maxTokens, json });
  return callClaude(prompt, maxTokens);
}

// Vilken AI kör vi, och svarar den? (för felsökning i appen)
app.get('/api/ai/status', async (_req, res) => {
  const opts = loadOptions();
  if (opts.ollama_url) {
    const url = opts.ollama_url.replace(/\/+$/, '');
    try {
      const r = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
      const models = r.ok ? (await r.json()).models?.map(m => m.name) : [];
      res.json({ provider: 'ollama', url, model: opts.ollama_model || 'llama3.2:3b', reachable: r.ok, models });
    } catch (e) {
      res.json({ provider: 'ollama', url, model: opts.ollama_model || 'llama3.2:3b', reachable: false, reason: e.message });
    }
  } else {
    res.json({ provider: 'claude', model: CLAUDE_MODEL, configured: !!getClaudeKey() });
  }
});

/** Plockar ut första JSON-objektet ur ett AI-svar (som ibland pratar runt). */
function parseAiJson(text) {
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
}

app.post('/api/assistent/rapport', async (_req, res) => {
  const data = readData();
  const today = todayStr();
  const dayName = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  const eventsToday = (data.kl_events || []).filter(e => e.date === today).map(e => e.title);
  const tasksOpen   = (data.kl_tasks  || []).filter(t => t.lane !== 'done').map(t => `${t.title} (${t.lane === 'progress' ? 'pågår' : 'att göra'}${t.prio === 'high' ? ', hög prio' : ''})`);
  const medsPending = (data.kl_medicin || []).filter(m => m.active !== false && (!m.lastGiven || m.lastGiven.slice(0, 10) !== today)).map(m => m.name);

  const prompt = `Du är familjens assistent. Idag är det ${dayName}.

Händelser idag: ${eventsToday.length ? eventsToday.join(', ') : 'inga'}
Öppna uppgifter: ${tasksOpen.length ? tasksOpen.join('; ') : 'inga'}
Mediciner ej givna idag: ${medsPending.length ? medsPending.join(', ') : 'alla givna'}

Skriv en kort dagsrapport på svenska (max 4 meningar) och föreslå max 3 nya konkreta uppgifter om något verkar saknas. Svara med ENDAST giltig JSON:
{"sammanfattning": "...", "forslag": ["...", "..."]}`;

  try {
    const text = await callAI(prompt, { maxTokens: 500, json: true });
    const parsed = parseAiJson(text);

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

// Fri text (mail, artikel, anteckningar) → kort sammanfattning på svenska
app.post('/api/assistent/sammanfatta', async (req, res) => {
  const text = (req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Ingen text att sammanfatta.' });

  try {
    const summary = await callAI(`Sammanfatta denna text kortfattat på svenska (max 3 meningar):\n\n${text}`, { maxTokens: 300 });
    res.json({ summary });
  } catch (e) {
    console.error('[assistent] Sammanfattningsfel:', e.message);
    res.status(502).json({ error: 'Sammanfattningen misslyckades: ' + e.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  Mail-digest — IMAP-inläsning + AI-triage
//
//  Konton anges i addon-optionen mail_accounts:
//    - name: "Björn"
//      user: "namn@gmail.com"
//      password: "app-lösenord"      (Gmail: kräver 2FA, skapas på
//      host: "imap.gmail.com"         myaccount.google.com/apppasswords)
//
//  Servern hämtar de senaste mailen, låter Claude sortera ut det
//  viktiga och sparar resultatet i kl_mail_digest. Lösenorden lämnar
//  aldrig HA-enheten — bara avsändare/ämne/utdrag skickas till Claude.
// ══════════════════════════════════════════════════════════════
function getMailAccounts() {
  const accs = loadOptions().mail_accounts;
  return Array.isArray(accs) ? accs.filter(a => a.user && a.password) : [];
}

async function fetchRecentMail(account, maxCount = 15) {
  // imapflow finns i Docker-imagen (och i projektets node_modules lokalt);
  // lazy-require så servern startar även om paketet saknas.
  const { ImapFlow } = require('imapflow');
  const client = new ImapFlow({
    host: account.host || 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: account.user, pass: account.password },
    logger: false,
  });

  const messages = [];
  await client.connect();
  try {
    await client.mailboxOpen('INBOX', { readOnly: true });
    // De senaste N mailen, nyast först
    const total = client.mailbox.exists;
    if (total === 0) return [];
    const from = Math.max(1, total - maxCount + 1);
    for await (const msg of client.fetch(`${from}:*`, { envelope: true, bodyParts: ['1'] })) {
      const snippetRaw = msg.bodyParts?.get('1')?.toString('utf8') || '';
      messages.push({
        uid: msg.uid,
        account: account.name || account.user,
        from: msg.envelope?.from?.[0]?.name || msg.envelope?.from?.[0]?.address || '?',
        fromAddr: msg.envelope?.from?.[0]?.address || '',
        subject: msg.envelope?.subject || '(inget ämne)',
        date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : null,
        snippet: snippetRaw.replace(/\s+/g, ' ').slice(0, 400),
      });
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return messages.reverse(); // nyast först
}

async function runMailDigest() {
  const accounts = getMailAccounts();
  if (!accounts.length) throw new Error('Inga mailkonton konfigurerade (addon-option mail_accounts).');

  const all = [];
  for (const acc of accounts) {
    try {
      all.push(...await fetchRecentMail(acc));
    } catch (e) {
      console.error(`[mail] Kunde inte hämta ${acc.user}:`, e.message);
    }
  }
  if (!all.length) throw new Error('Inga mail kunde hämtas — kontrollera konton och app-lösenord.');

  // Prioriteringsregler från appen (Mail-sidan): VIP tas alltid med, blockerade ses aldrig
  const data0 = readData();
  const prefs = data0.kl_mail_prefs || {};
  const vip   = (prefs.vip   || []).map(s => s.toLowerCase().trim()).filter(Boolean);
  const block = (prefs.block || []).map(s => s.toLowerCase().trim()).filter(Boolean);
  const matchesList = (m, list) => list.some(t =>
    (m.fromAddr || '').toLowerCase().includes(t) ||
    (m.from || '').toLowerCase().includes(t) ||
    (m.subject || '').toLowerCase().includes(t));

  const candidates = all.filter(m => !matchesList(m, block));

  const mailList = candidates.map((m, i) =>
    `${i}. [${m.account}] Från: ${m.from} <${m.fromAddr}> | Ämne: ${m.subject} | ${m.snippet.slice(0, 200)}`
  ).join('\n');

  const vipHint = vip.length
    ? `\nFamiljen har markerat dessa avsändare/nyckelord som EXTRA VIKTIGA — ta alltid med mail som matchar: ${vip.join(', ')}.`
    : '';

  const prompt = `Du hjälper en barnfamilj att sortera sin mail. Här är de senaste mailen:

${mailList}

Välj ut de VIKTIGASTE (max 6) — sådant som kräver handling eller är relevant för familjen: räkningar, skola/förskola, vård, myndigheter, samfällighet, bokningar, deadlines, privata mail från riktiga personer. Ignorera nyhetsbrev, reklam och kvitton på småköp.${vipHint}

Svara med ENDAST giltig JSON:
{"viktiga": [{"index": 0, "sammanfattning": "en mening om vad mailet gäller", "atgard": "kort åtgärd eller tom sträng"}]}`;

  const text = await callAI(prompt, { maxTokens: 800, json: true });
  const parsed = parseAiJson(text);
  const toItem = (m, summary, action, isVip) => ({
    id: `mail_${m.account}_${m.uid}`,
    account: m.account,
    from: m.from,
    subject: m.subject,
    date: m.date,
    summary: summary || '',
    action: action || '',
    vip: !!isVip,
  });

  const picked = (parsed.viktiga || []).filter(v => candidates[v.index])
    .map(v => toItem(candidates[v.index], v.sammanfattning, v.atgard, matchesList(candidates[v.index], vip)));

  // Deterministisk garanti: VIP-mail som AI:n missade läggs alltid till överst
  const pickedIds = new Set(picked.map(p => p.id));
  const vipMissed = candidates.filter(m => matchesList(m, vip) && !pickedIds.has(`mail_${m.account}_${m.uid}`))
    .map(m => toItem(m, '', '', true));

  const items = [...vipMissed, ...picked].sort((a, b) => (b.vip ? 1 : 0) - (a.vip ? 1 : 0)).slice(0, 10);

  const digest = { time: new Date().toISOString(), scanned: all.length, blocked: all.length - candidates.length, items };
  const data = readData();
  data.kl_mail_digest = digest;
  writeData(data);
  console.log(`[mail] Digest klar: ${items.length} viktiga (${vipMissed.length} VIP-garanterade) av ${all.length} skannade`);
  return digest;
}

app.post('/api/mail/check', async (_req, res) => {
  try {
    res.json(await runMailDigest());
  } catch (e) {
    console.error('[mail] Digest-fel:', e.message);
    res.status(502).json({ error: e.message });
  }
});

app.get('/api/mail/digest', (_req, res) => {
  res.json(readData().kl_mail_digest || { time: null, items: [] });
});

// Automatisk mailkoll var 30:e minut (bara om konton finns konfigurerade)
setInterval(() => {
  if (getMailAccounts().length) {
    runMailDigest().catch(e => console.error('[mail] Periodisk koll misslyckades:', e.message));
  }
}, 30 * 60 * 1000);

// ══════════════════════════════════════════════════════════════
//  Säkerhetskopiering
//
//  Tre lager:
//    1. Automatiska dagliga snapshots i /data/backups (behåll 14)
//    2. GET /api/backup — ladda ner datafilen (off-device-kopia)
//    3. POST /api/restore — läs tillbaka en backupfil
//
//  OBS: addon-options (maillösenord, API-nycklar) ägs av HA och
//  ingår INTE — de täcks av HA:s egen backup (Inställningar →
//  System → Säkerhetskopior).
// ══════════════════════════════════════════════════════════════
const BACKUP_DIR = path.join(path.dirname(DATA_FILE), 'backups');
const BACKUP_KEEP = 14;
const BACKUP_NAME_RE = /^familjeapp-[\w.-]+\.json$/; // skydd mot path traversal

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => BACKUP_NAME_RE.test(f))
    .map(f => {
      const st = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, time: st.mtime.toISOString(), size: st.size };
    })
    .sort((a, b) => b.time.localeCompare(a.time));
}

function createSnapshot(label) {
  if (!fs.existsSync(DATA_FILE)) return null;
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const name = `familjeapp-${label ? label + '-' : ''}${stamp}.json`;
  fs.copyFileSync(DATA_FILE, path.join(BACKUP_DIR, name));
  // Rotera: behåll de senaste BACKUP_KEEP (pre-restore-filer räknas med)
  const extra = listBackups().slice(BACKUP_KEEP);
  extra.forEach(b => { try { fs.unlinkSync(path.join(BACKUP_DIR, b.name)); } catch {} });
  console.log(`[backup] Snapshot skapad: ${name}`);
  return name;
}

/** Rimlighetskoll innan vi skriver över datafilen med uppladdat innehåll. */
function looksLikeAppData(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj) &&
    Object.keys(obj).some(k => k.startsWith('kl_') || k.startsWith('fp_') || k === 'app_design');
}

// Ladda ner aktuell data som fil
app.get('/api/backup', (_req, res) => {
  if (!fs.existsSync(DATA_FILE)) return res.status(404).json({ error: 'Ingen datafil ännu.' });
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Disposition', `attachment; filename="klara-backup-${stamp}.json"`);
  res.setHeader('Content-Type', 'application/json');
  fs.createReadStream(DATA_FILE).pipe(res);
});

// Lista snapshots på servern
app.get('/api/backups', (_req, res) => res.json({ backups: listBackups() }));

// Skapa snapshot manuellt
app.post('/api/backup/now', (_req, res) => {
  const name = createSnapshot('manuell');
  if (!name) return res.status(404).json({ error: 'Ingen datafil att kopiera ännu.' });
  res.json({ created: name, backups: listBackups() });
});

// Återställ från uppladdad fil (ersätter hela datafilen)
app.post('/api/restore', (req, res) => {
  const body = req.body;
  if (!looksLikeAppData(body)) {
    return res.status(400).json({ error: 'Filen ser inte ut som en Klara-backup (hittar inga kl_*-nycklar).' });
  }
  createSnapshot('pre-restore'); // ångra-punkt
  writeData(body);
  console.log(`[backup] Data återställd från uppladdad fil (${Object.keys(body).length} nycklar)`);
  res.json({ restored: true, keys: Object.keys(body).length });
});

// Återställ från server-snapshot
app.post('/api/backup/restore', (req, res) => {
  const name = req.body?.name || '';
  if (!BACKUP_NAME_RE.test(name)) return res.status(400).json({ error: 'Ogiltigt backupnamn.' });
  const file = path.join(BACKUP_DIR, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Backupen finns inte.' });
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return res.status(400).json({ error: 'Backupfilen är korrupt (ogiltig JSON).' });
  }
  if (!looksLikeAppData(parsed)) return res.status(400).json({ error: 'Backupfilen ser inte ut som Klara-data.' });
  createSnapshot('pre-restore');
  writeData(parsed);
  console.log(`[backup] Data återställd från snapshot: ${name}`);
  res.json({ restored: true, from: name });
});

// Dagligt snapshot: kolla varje timme, skapa en per dygn
let lastSnapshotDay = '';
setInterval(() => {
  const day = todayStr();
  if (day !== lastSnapshotDay && fs.existsSync(DATA_FILE)) {
    const already = listBackups().some(b => !b.name.includes('manuell') && !b.name.includes('pre-restore') && b.time.slice(0, 10) === day);
    if (!already) createSnapshot('');
    lastSnapshotDay = day;
  }
}, 60 * 60 * 1000);

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

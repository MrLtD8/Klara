// ─── Klara App Registry & Plugin API ─────────────────────────────────────────
// Version 1.0  |  https://klara.app/developers
//
// Third-party developers can build apps that integrate with Klara by:
//  1. Hosting a web app at any HTTPS URL
//  2. Publishing a manifest (see APP_MANIFEST_SCHEMA below)
//  3. Using window.KlaraSDK to read/write family data (injected via postMessage)

export const KLARA_VERSION     = '2.0.0';
export const REGISTRY_VERSION  = '1.0';

// ─── Permissions ──────────────────────────────────────────────────────────────
export const PERMISSIONS = {
  'read:members':  'Läsa familjemedlemmar och profiler',
  'read:tasks':    'Läsa uppgifter och status',
  'write:tasks':   'Skapa och ändra uppgifter',
  'read:events':   'Läsa kalenderevents',
  'write:events':  'Skapa och ändra kalenderevents',
  'read:lists':    'Läsa listor',
  'write:lists':   'Ändra listor',
};

// ─── App manifest schema (documentation) ──────────────────────────────────────
export const APP_MANIFEST_SCHEMA = {
  id:               'string  — unikt ID, a-z0-9 och bindestreck, t.ex. "recipe-manager"',
  name:             'string  — visningsnamn, max 40 tecken',
  version:          'string  — semver t.ex. "1.0.0"',
  description:      'string  — kort beskrivning, max 120 tecken',
  author:           'string  — ditt namn eller organisation',
  icon:             'string  — emoji eller https:// URL till 64×64px bild',
  category:         '"produktivitet" | "hälsa" | "ekonomi" | "barn" | "hem" | "kul"',
  type:             '"iframe"  — appen körs i en sandboxad iframe i Klara',
  url:              'string  — https:// URL till din app (måste stödja iframe)',
  permissions:      'string[] — lista av behörigheter från PERMISSIONS ovan',
  minKlaraVersion:  'string  — (valfri) lägsta Klara-version som krävs',
  screenshots:      'string[] — (valfri) HTTPS-URLs till skärmdumpar',
  privacyUrl:       'string  — (valfri) länk till integritetspolicy',
};

// ─── SDK-meddelanden (postMessage protokoll) ──────────────────────────────────
// Klara skickar till din iframe:
//   { type: 'KLARA_CONTEXT', payload: { members, tasks, events, version } }
//   { type: 'KLARA_UPDATE', payload: { changed: 'tasks' | 'events' | 'members' } }
//
// Din iframe kan skicka till Klara (window.parent.postMessage):
//   { type: 'KLARA_WRITE_TASK', payload: taskObject }
//   { type: 'KLARA_WRITE_EVENT', payload: eventObject }
//   { type: 'KLARA_RESIZE', payload: { height: number } }
//   { type: 'KLARA_NAVIGATE', payload: 'kalender' | 'uppgifter' | ... }

// ─── Kategorier ───────────────────────────────────────────────────────────────
export const APP_CATEGORIES = [
  { id: 'alla',          label: 'Alla appar' },
  { id: 'produktivitet', label: '📋 Produktivitet' },
  { id: 'hälsa',         label: '💊 Hälsa' },
  { id: 'ekonomi',       label: '💰 Ekonomi' },
  { id: 'barn',          label: '⭐ Barn & Sysslor' },
  { id: 'hem',           label: '🏠 Hem & Mat' },
  { id: 'kul',           label: '🎉 Kul & Fritid' },
];

// ─── Community-katalog (tillgängliga appar) ───────────────────────────────────
export const COMMUNITY_APPS = [
  {
    id:          'recipe-manager',
    name:        'Recepthanteraren',
    icon:        '🍳',
    category:    'hem',
    description: 'Spara, planera och dela recept för familjen. Genererar automatisk inköpslista.',
    author:      'Klara Labs',
    version:     '1.0.0',
    verified:    true,
    comingSoon:  true,
    permissions: ['read:members', 'write:lists'],
    screenshots: [],
  },
  {
    id:          'vacation-planner',
    name:        'Semesterplaneraren',
    icon:        '✈️',
    category:    'kul',
    description: 'Planera och organisera familjens semestrar med budget, aktiviteter och packlista.',
    author:      'Klara Labs',
    version:     '0.9.0',
    verified:    true,
    comingSoon:  true,
    permissions: ['read:members', 'write:events'],
    screenshots: [],
  },
  {
    id:          'homework-tracker',
    name:        'Läxkollen',
    icon:        '📚',
    category:    'barn',
    description: 'Håll koll på läxor, prov och inlämningar för barnen – med direktlänk till skolschemat.',
    author:      'Klara Labs',
    version:     '1.1.0',
    verified:    true,
    comingSoon:  true,
    permissions: ['read:members'],
    screenshots: [],
  },
  {
    id:          'meal-planner',
    name:        'Måltidsplaneraren',
    icon:        '🥗',
    category:    'hem',
    description: 'Veckans matplan med automatisk inköpslista och nutritionsöversikt.',
    author:      'Klara Community',
    version:     '0.8.0',
    verified:    false,
    comingSoon:  true,
    permissions: ['read:members', 'write:lists'],
    screenshots: [],
  },
  {
    id:          'chore-wheel',
    name:        'Sysslohjulet Pro',
    icon:        '🎡',
    category:    'barn',
    description: 'Avancerat slumphjul för sysslor med statistik och anpassade belöningar.',
    author:      'Klara Community',
    version:     '2.0.0',
    verified:    false,
    comingSoon:  true,
    permissions: ['read:members', 'write:tasks'],
    screenshots: [],
  },
  {
    id:          'expense-tracker',
    name:        'Utgiftsdetektiven',
    icon:        '🔍',
    category:    'ekonomi',
    description: 'Detaljerad kategorisering och analys av familjens utgifter med diagram.',
    author:      'Klara Labs',
    version:     '1.0.0',
    verified:    true,
    comingSoon:  true,
    permissions: ['read:members'],
    screenshots: [],
  },
  {
    id:          'sports-tracker',
    name:        'Träningsdagboken',
    icon:        '⚽',
    category:    'hälsa',
    description: 'Logga träning, matcher och aktiviteter för hela familjen med statistik.',
    author:      'Klara Community',
    version:     '0.7.0',
    verified:    false,
    comingSoon:  true,
    permissions: ['read:members', 'write:events'],
    screenshots: [],
  },
  {
    id:          'family-photos',
    name:        'Familjealbum',
    icon:        '📸',
    category:    'kul',
    description: 'Delade familjefoton med automatisk tidslinjevyn och minnesnotiser.',
    author:      'Klara Labs',
    version:     '0.5.0',
    verified:    true,
    comingSoon:  true,
    permissions: ['read:members'],
    screenshots: [],
  },
];

// ─── SDK-factory (skapas av Layout och injiceras i iframes) ──────────────────
export function createKlaraSDK({ members, tasks, events }) {
  return {
    version:    REGISTRY_VERSION,
    getMembers: () => JSON.parse(JSON.stringify(members)),
    getTasks:   () => JSON.parse(JSON.stringify(tasks)),
    getEvents:  () => JSON.parse(JSON.stringify(events)),
  };
}

// ─── Iframe-kommunikation: skicka kontext till installerad app ────────────────
export function sendContextToApp(iframeEl, { members, tasks, events }) {
  if (!iframeEl || !iframeEl.contentWindow) return;
  iframeEl.contentWindow.postMessage({
    type: 'KLARA_CONTEXT',
    payload: { members, tasks, events, version: KLARA_VERSION },
  }, '*');
}

/**
 * sharedData.js
 *
 * Delat datalager mellan de två designerna (Klara = lila, Familjen = grå).
 *
 * Bakgrund: båda designerna synkar redan mot samma /api/data-fil via
 * useLocalStorage, MEN de använde olika nycklar och format för samma saker.
 * Lägger man till en uppgift i den ena syntes den inte i den andra.
 *
 * Lösning: Klaras 'kl_*'-nycklar är kanoniska (de innehåller den riktiga,
 * driftsatta datan). Den grå designen läser/skriver samma nycklar via
 * adapter-hookarna här. Adaptern översätter Klaras format ⇄ grå formatet
 * och behåller fält som bara finns i den ena designen ("superset"), så att
 * inget tappas vid en tur-och-retur.
 *
 * Vad som delas (kärnan): familj/medlemmar, uppgifter och kalenderhändelser.
 * Medicin delas INTE än — modellerna skiljer sig för mycket (grå grupperar
 * per dagsflöde, Klara har ett times-objekt per medicin).
 */

import { useLocalStorage } from './useLocalStorage';

// Speglar Klaras defaultMembers (src/klara/Layout.jsx) så en ny installation
// visar samma startfamilj oavsett design. Vid riktig data används den aldrig.
const DEFAULT_MEMBERS = [
  { id: 'm1', name: 'Alex', role: 'Förälder', color: '#7C5CBF', initials: 'A' },
  { id: 'm2', name: 'Sara', role: 'Förälder', color: '#F97316', initials: 'S' },
  { id: 'm3', name: 'Ella', role: '12 år',    color: '#22C55E', initials: 'E' },
  { id: 'm4', name: 'Noah', role: '9 år',     color: '#3B82F6', initials: 'N' },
];

// ── Generisk array-adapter ────────────────────────────────────
// Läser kanonisk array (kl_*), exponerar den grå-formaterad, och mappar
// tillbaka vid skrivning. Använder den underliggande setterns funktionella
// form så att prev alltid är färskt (viktigt för p=>[...p, x]-mönstret).
function useMappedArray(key, init, toView, toStore) {
  const [raw, setRaw] = useLocalStorage(key, init);
  const view = toView(raw);
  const setView = updater => {
    setRaw(prevRaw => {
      const prevView = toView(prevRaw);
      const nextView = typeof updater === 'function' ? updater(prevView) : updater;
      return toStore(nextView, prevRaw);
    });
  };
  return [view, setView];
}

// ── Medlemmar ─────────────────────────────────────────────────
function memberToGray(m) {
  return {
    ...m,
    id: m.id,
    name: m.name || '',
    color: m.color || '#6B4EA8',
    av: m.av || m.initials || (m.name ? m.name.charAt(0).toUpperCase() : '?'),
    inSysslor: m.inSysslor ?? false,
  };
}
function membersToKl(grayArr, prevKl) {
  return (grayArr || []).map(g => {
    const prev = (prevKl || []).find(p => p.id === g.id) || {};
    const initials = g.av || prev.initials || (g.name ? g.name.charAt(0).toUpperCase() : '');
    return {
      ...prev, ...g,
      initials,
      role: prev.role || g.role || 'Familjemedlem',
      inSysslor: g.inSysslor ?? prev.inSysslor ?? false,
    };
  });
}

/** Grå designens familj-state ({name, members}) backad av kl_members + kl_family_name. */
export function useSharedFamily() {
  const [klMembers, setKlMembers] = useLocalStorage('kl_members', DEFAULT_MEMBERS);
  const [name, setName] = useLocalStorage('kl_family_name', 'Familjen');
  const family = { name, members: (klMembers || []).map(memberToGray) };
  const setFamily = updater => {
    const next = typeof updater === 'function'
      ? updater({ name, members: (klMembers || []).map(memberToGray) })
      : updater;
    if (next && next.name !== undefined) setName(next.name || 'Familjen');
    setKlMembers(prev => membersToKl(next ? next.members : [], prev));
  };
  return [family, setFamily];
}

// ── Uppgifter ─────────────────────────────────────────────────
// Klara: prio 'high'|'med'|'low', epic (sträng). Grå: prio 'urgent'|'high'|
// 'medium'|'low', epicId. 'urgent' saknas i Klara → degraderas till 'high'.
const grayToKlPrio = p => (p === 'medium' ? 'med' : p === 'urgent' ? 'high' : p || 'med');
const klToGrayPrio = p => (p === 'med' ? 'medium' : p || 'medium');

function taskToGray(k, i) {
  return {
    ...k, // behåll alla lagrade fält (även grå-specifika)
    id: k.id,
    title: k.title || '',
    desc: k.desc || '',
    tags: k.tags || [],
    mids: k.mids || [],
    prio: klToGrayPrio(k.prio),
    lane: k.lane || 'ready',
    recur: k.recur || 'none',
    hideGuest: k.hideGuest || false,
    estimate: k.estimate || 'none',
    subtasks: k.subtasks || [],
    epicId: k.epicId ?? k.epic ?? null,
    order: typeof k.order === 'number' ? k.order : i,
  };
}
function tasksToKl(grayArr, prevKl) {
  return (grayArr || []).map(g => {
    const prev = (prevKl || []).find(p => p.id === g.id) || {};
    return {
      ...prev, ...g, // kanoniska posten är ett superset av båda formaten
      prio: grayToKlPrio(g.prio),     // Klara-giltig prioritet
      epic: g.epicId ?? prev.epic ?? '',
      deadline: prev.deadline ?? '',
    };
  });
}

/** Grå designens tasks-state backad av kl_tasks. */
export function useSharedTasks() {
  return useMappedArray('kl_tasks', [], arr => (arr || []).map(taskToGray), tasksToKl);
}

// ── Kalenderhändelser ─────────────────────────────────────────
// Klaras kalendersida (kl_cal_events) använder SAMMA format som grå:
// {id, type, title, who, recur, date}. Alltså nära nog passthrough — vi
// normaliserar bara defaults så grå-renderingen (t.ex. toMin) är säker.
// OBS: kl_events är en SEPARAT planerings-/Hem-widget-store i Klara, inte
// kalendern — därför backar vi kl_cal_events här.
function eventToGray(k) {
  return {
    ...k,
    type: k.type || 'note',
    title: k.title || '',
    who: k.who || '',
    recur: k.recur || 'none',
    time: k.time || '',
    date: k.date,
  };
}
function eventsToKl(grayArr, prevKl) {
  return (grayArr || []).map(g => {
    const prev = (prevKl || []).find(p => p.id === g.id) || {};
    return { ...prev, ...g };
  });
}

/** Grå designens calEvents-state backad av Klaras kalender (kl_cal_events). */
export function useSharedEvents() {
  return useMappedArray('kl_cal_events', [], arr => (arr || []).map(eventToGray), eventsToKl);
}

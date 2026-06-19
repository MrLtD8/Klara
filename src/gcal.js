/**
 * gcal.js
 *
 * Delade hjälpare för Google Kalender via iCal — stödjer FLERA kalendrar.
 * Nyckeln 'kl_gcal' delas mellan båda designerna.
 *
 * Format: { enabled: bool (huvudströmbrytare), calendars: [
 *   { id, name, icsUrl, color, enabled }
 * ] }
 *
 * Bakåtkompatibelt med gamla { enabled, icsUrl } (en länk) — migreras
 * automatiskt till en kalender i listan vid läsning.
 */

// Distinkta färger så kalendrar går att skilja åt visuellt.
export const GCAL_COLORS = ['#4C7BD9', '#E0707B', '#46A26B', '#E0A03C', '#9B6BD9', '#3CA8B8', '#D9694C', '#6B8E23'];

export const DEFAULT_GCAL = { enabled: false, calendars: [] };

let _idSeq = 0;
export function newCalendarId() {
  return 'cal_' + Date.now().toString(36) + '_' + (_idSeq++);
}

/** Normaliserar lagrat värde till { enabled, calendars[] } och migrerar gammalt format. */
export function normalizeGcal(g) {
  if (!g || typeof g !== 'object') return { enabled: false, calendars: [] };
  let calendars = Array.isArray(g.calendars) ? g.calendars : [];
  // Migrera gammalt { enabled, icsUrl }
  if (calendars.length === 0 && g.icsUrl) {
    calendars = [{ id: 'cal_legacy', name: 'Kalender 1', icsUrl: g.icsUrl, color: GCAL_COLORS[0], enabled: true }];
  }
  return { enabled: !!g.enabled, calendars };
}

/** Returnerar de kalendrar som faktiskt ska hämtas (huvudströmbrytare PÅ + egen toggle PÅ + URL). */
export function activeCalendars(g) {
  const n = normalizeGcal(g);
  if (!n.enabled) return [];
  return n.calendars.filter(c => c && c.enabled && c.icsUrl && c.icsUrl.trim());
}

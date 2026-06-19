/**
 * useIcsCalendars.js
 *
 * Hämtar och slår ihop händelser från FLERA iCal-kalendrar via server-proxyn
 * /api/calendar. Varje kalenders händelser märks med kalenderns färg och namn
 * (who) så de går att skilja åt. En kalender som fallerar stoppar inte de andra.
 *
 * @param {Array} calendars - lista av { id, name, icsUrl, color } (redan filtrerad
 *                            till aktiva, t.ex. via activeCalendars() i gcal.js)
 * @returns {{events: Array, loading: boolean, error: string|null}}
 */
import { useState, useEffect } from 'react';

export default function useIcsCalendars(calendars) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const list = Array.isArray(calendars) ? calendars : [];
  // Stabil dep-nyckel — undviker att effekten loopar på nya array-referenser.
  const key = list.map(c => `${c.id}|${c.icsUrl}|${c.color}`).join(',');

  useEffect(() => {
    if (list.length === 0) { setEvents([]); setError(null); setLoading(false); return; }
    let alive = true;
    setLoading(true); setError(null);

    Promise.all(list.map(c =>
      fetch(`/api/calendar?url=${encodeURIComponent(c.icsUrl)}`)
        .then(r => { if (!r.ok) throw new Error('fel'); return r.json(); })
        .then(data => (data.events || []).map(ev => ({
          ...ev,
          id: `${c.id}_${ev.id}`,           // unikt id även om två kalendrar krockar
          color: c.color,
          who: ev.who || c.name || '',
          calendarId: c.id,
          calendarName: c.name || '',
        })))
        .catch(() => ({ __failed: true }))   // markera felad kalender, fäll inte de andra
    )).then(results => {
      if (!alive) return;
      const ok = results.filter(r => !r.__failed);
      const merged = ok.flat();
      setEvents(merged);
      if (ok.length === 0) setError('Kunde inte hämta någon kalender');
      else if (ok.length < results.length) setError('Någon kalender kunde inte hämtas');
      setLoading(false);
    }).catch(e => { if (alive) { setError(e.message); setLoading(false); } });

    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { events, loading, error };
}

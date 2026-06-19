import { useState, useEffect } from "react";

/**
 * useIcsCalendar
 *
 * Hämtar händelser från en Google Kalender via dess hemliga iCal-länk,
 * proxyat genom servern (/api/calendar) för att undvika CORS.
 *
 * @param {string|null} icsUrl - Hemlig iCal-URL, eller null/tom för avstängd synk
 * @returns {{ events: Array, loading: boolean, error: string|null }}
 */
export default function useIcsCalendar(icsUrl) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!icsUrl) { setEvents([]); return; }
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/calendar?url=${encodeURIComponent(icsUrl)}`)
      .then(r => { if (!r.ok) throw new Error('Kunde inte hämta kalendern'); return r.json(); })
      .then(data => { if (alive) setEvents(data.events || []); })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [icsUrl]);

  return { events, loading, error };
}

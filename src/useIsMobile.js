import { useState, useEffect } from 'react';

/**
 * useIsMobile — true när skärmen är smalare än `breakpoint` (default 640px).
 *
 * Matchar mobildetekteringen i index.js så att både Klara och Familjen
 * behandlar samma bredder som "telefon". iPad (768px+) räknas som desktop
 * och behåller sidomenyn.
 */
export function useIsMobile(breakpoint = 640) {
  // ?desktop / ?mobile i URL:en tvingar ett läge (samma override som index.js).
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const forced = search.includes('mobile') ? true : search.includes('desktop') ? false : null;

  const [isMobile, setIsMobile] = useState(
    forced !== null ? forced : (typeof window !== 'undefined' && window.innerWidth < breakpoint)
  );

  useEffect(() => {
    if (forced !== null) { setIsMobile(forced); return; }
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint, forced]);

  return isMobile;
}

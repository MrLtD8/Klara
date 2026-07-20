import { useState, useEffect } from 'react';

/**
 * useIsMobile — true när skärmen är smalare än `breakpoint` (default 640px).
 *
 * Matchar mobildetekteringen i index.js så att både Klara och Familjen
 * behandlar samma bredder som "telefon". iPad (768px+) räknas som desktop
 * och behåller sidomenyn.
 */
export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < breakpoint
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}

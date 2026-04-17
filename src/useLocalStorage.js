/**
 * useLocalStorage.js
 *
 * Syfte: React-hook för att läsa och skriva state som automatiskt
 *        synkroniseras med webbläsarens localStorage.
 * Exporterar: useLocalStorage
 * Beroenden: react (useState)
 *
 * SÄKERHETSNOTERING:
 * - All data lagras lokalt i webbläsarens localStorage, OKRYPTERAT.
 * - Lagra aldrig lösenord, personnummer eller annan känslig information här.
 * - Data är tillgänglig för alla skript som körs på samma domän.
 * - JSON.parse() körs inuti try/catch för att hantera korrupt data säkert.
 * - Inga nätverksanrop görs — data lämnar aldrig enheten via denna hook.
 */

import { useState } from "react";

/**
 * useLocalStorage
 *
 * Fungerar precis som useState men persisterar värdet i localStorage.
 * Om nyckeln inte finns, eller om data är korrupt, används init-värdet.
 *
 * @param {string} key   - Nyckel i localStorage, t.ex. "fp_tasks".
 * @param {*}      init  - Standardvärde om ingen sparad data finns.
 * @returns {[*, Function]} Tuple med [värde, sättarfunktion] — identisk API som useState.
 *
 * @example
 * const [tasks, setTasks] = useLocalStorage("fp_tasks", []);
 * setTasks(prev => [...prev, nyTask]);  // stöder funktionstuppdatering
 */
export function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      // Returnera sparat värde om det finns, annars init
      return s !== null ? JSON.parse(s) : init;
    } catch {
      // Om JSON.parse misslyckas (t.ex. korrupt data) — använd init
      return init;
    }
  });

  const set = v => setVal(prev => {
    const next = typeof v === "function" ? v(prev) : v;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Tyst fel om localStorage är fullt eller blockerat (t.ex. privat surfning)
    }
    return next;
  });

  return [val, set];
}

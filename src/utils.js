/**
 * utils.js
 *
 * Syfte: Hjälpfunktioner och React-hooks som används av flera komponenter.
 * Exporterar: useClock, getISOWeek, getWeekStart, addDays, fmtDate, toMin
 * Beroenden: react (useState, useEffect)
 */

import { useState, useEffect } from "react";
import { FLOWS } from "./constants";

/* ═══ KLOCKHOOK ══════════════════════════════════════════════════
 * Returnerar aktuellt Date-objekt och uppdaterar det varje sekund.
 * Används för att visa klockan och avgöra aktivt dagflöde.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * useClock
 * @returns {Date} Aktuell tid, uppdateras varje sekund.
 */
export function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/* ═══ VECKONUMMER (ISO 8601) ═════════════════════════════════════
 * Räknar ut ISO-veckonummer för ett givet Date-objekt.
 * Måndag = första dagen i veckan (europeisk standard).
 * ═══════════════════════════════════════════════════════════════ */
/**
 * getISOWeek
 * @param {Date} d - Datumet att beräkna veckonummer för.
 * @returns {number} ISO-veckonummer (1–53).
 */
export function getISOWeek(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil((((dt - ys) / 86400000) + 1) / 7);
}

/* ═══ VECKANS STARTDATUM ═════════════════════════════════════════
 * Returnerar ett Date-objekt som pekar på föregående måndag
 * (eller samma dag om det redan är måndag), kl. 00:00:00.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * getWeekStart
 * @param {Date} d - Valfritt datum inom veckan.
 * @returns {Date} Måndag 00:00:00 för den veckan.
 */
export function getWeekStart(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay() || 7;
  dt.setDate(dt.getDate() - day + 1);
  return dt;
}

/* ═══ LÄGG TILL DAGAR ════════════════════════════════════════════
 * Returnerar ett nytt Date-objekt med n dagar tillagda (eller borttagna
 * om n är negativt).
 * ═══════════════════════════════════════════════════════════════ */
/**
 * addDays
 * @param {Date} d - Startdatum.
 * @param {number} n - Antal dagar att lägga till (kan vara negativt).
 * @returns {Date} Nytt datum.
 */
export function addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}

/* ═══ FORMATERA DATUM SOM STRÄNG ══════════════════════════════════
 * Returnerar datumet i formatet "YYYY-MM-DD", t.ex. "2025-04-12".
 * Används som nyckel i kalender-state-objekt.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * fmtDate
 * @param {Date} d - Datum att formatera.
 * @returns {string} Datum på formatet "YYYY-MM-DD".
 */
export function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ═══ KONVERTERA TID TILL MINUTER ════════════════════════════════
 * Omvandlar en tidssträng på formatet "HH:MM" till antal minuter
 * sedan midnatt. Används i CalPanel för att räkna ut om en händelse
 * är pågående, passerad eller kommande.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * toMin
 * @param {string} t - Tidssträng på formatet "HH:MM".
 * @returns {number} Antal minuter sedan midnatt.
 */
export function toMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* ═══ AKTIVT DAGFLÖDE ════════════════════════════════════════════
 * Intern hjälpfunktion — returnerar id för det flöde som är aktivt
 * baserat på timmen (0–23). Faller tillbaka på kvällsflödet om ingen
 * matchning hittas.
 * ═══════════════════════════════════════════════════════════════ */
/**
 * getActiveFlowId
 * @param {number} h - Aktuell timme (0–23).
 * @returns {string} Id för aktivt flöde ("morning" | "day" | "afternoon" | "evening").
 */
export function getActiveFlowId(h) {
  return (FLOWS.find(f => h >= f.startH && h < f.endH) || FLOWS[3]).id;
}

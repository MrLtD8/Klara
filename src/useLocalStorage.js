/**
 * useLocalStorage.js
 *
 * Syfte: React-hook för state som sparas i localStorage OCH synkroniseras
 *        mot en lokal server (Animus Heart / HA-addon) om en sådan finns.
 *
 * Hur synken fungerar:
 *   1. Vid första renderingen läses data från localStorage (omedelbart, inget väntan).
 *   2. Vid mount hämtas data från /api/data (servern på Animus Heart).
 *      Om servern svarar uppdateras state och localStorage — alla enheter
 *      på samma nätverk får då samma data.
 *   3. Vid varje skrivning sparas data till localStorage OCH skickas till servern.
 *   4. Om servern INTE svarar (t.ex. vid lokal utveckling) fungerar appen
 *      precis som innan — bara localStorage används. Ingen felvisning.
 *
 * Resultat:
 *   - Samma data på iPad, telefon och dator — så länge de når samma Animus Heart.
 *   - Fungerar offline / utan server (faller tillbaka på localStorage).
 *   - Ingen molntjänst eller externa konton krävs.
 */

import { useState, useEffect } from "react";

// ── Server-sync (modul-nivå, delas av alla hook-instanser) ────
// _cache:     null = ej laddad ännu | objekt = laddad serverdata
// _promise:   pågående fetch (förhindrar parallella anrop)
// _available: null = okänd | true = server svarar | false = ingen server
let _cache    = null;
let _promise  = null;
let _available = null;

/** Hämtar all data från servern (en gång per sidladdning). */
function serverLoad() {
  if (_cache !== null)  return Promise.resolve(_cache);
  if (_promise !== null) return _promise;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500); // 2.5 s timeout

  _promise = fetch('/api/data', { signal: ctrl.signal })
    .then(r => {
      clearTimeout(timer);
      return r.ok ? r.json() : {};
    })
    .then(data => {
      _cache    = data;
      _promise  = null;
      _available = true;
      return data;
    })
    .catch(() => {
      clearTimeout(timer);
      _cache    = {};
      _promise  = null;
      _available = false; // Ingen server — kör lokalt
      return {};
    });

  return _promise;
}

/** Skriver uppdaterad data till servern (brand-and-forget). */
function serverSave(key, value) {
  if (_available === false) return; // Ingen server, skippa
  if (_cache === null) return;      // Inte laddat än

  _cache = { ..._cache, [key]: value };
  const snapshot = _cache;

  fetch('/api/data', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(snapshot),
  }).catch(() => {
    // Tyst fel — servern kanske inte svarar just nu
  });
}

// ── Hook ──────────────────────────────────────────────────────
/**
 * useLocalStorage
 *
 * Fungerar som useState men:
 *   - Persisterar i localStorage (som tidigare)
 *   - Synkar automatiskt mot /api/data om Animus Heart-servern finns
 *
 * @param {string} key   - Nyckel, t.ex. "fp_tasks"
 * @param {*}      init  - Defaultvärde om ingen data finns
 * @returns {[*, Function]} [värde, sättarfunktion] — samma API som useState
 *
 * @example
 * const [tasks, setTasks] = useLocalStorage("fp_tasks", []);
 */
export function useLocalStorage(key, init) {
  // Läs från localStorage direkt (snabbt, ingen fördröjning)
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : init;
    } catch {
      return init;
    }
  });

  // Vid mount: hämta från server och uppdatera om servern har nyare data
  useEffect(() => {
    let alive = true;
    serverLoad().then(serverData => {
      if (!alive) return;
      if (key in serverData) {
        const serverVal = serverData[key];
        try { localStorage.setItem(key, JSON.stringify(serverVal)); } catch {}
        setVal(serverVal);
      }
    });
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sättarfunktion: skriver till localStorage + server
  const set = updater => {
    setVal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      serverSave(key, next);
      return next;
    });
  };

  return [val, set];
}

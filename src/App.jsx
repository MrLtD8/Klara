// ─────────────────────────────────────────────────────────────
//  App — väljer aktiv design
//
//  Två kompletta designer delar samma backend (/api/data):
//    - 'klara'    → lila designen (src/klara/)
//    - 'familjen' → grå designen (src/familjedashboard.jsx)
//
//  Valet sparas under den synkade nyckeln 'app_design' och kan
//  ändras i respektive design's inställningar. Hooken läser
//  localStorage synkront, så rätt design renderas direkt efter
//  en omladdning (ingen blink). Servern synkar valet till övriga
//  enheter på nätet.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useLocalStorage } from './useLocalStorage';
import KlaraLayout from './klara/Layout';
import FamiljeDashboard from './familjedashboard';
import ProfilVy from './klara/ProfilVy';

export default function App() {
  const [design] = useLocalStorage('app_design', 'klara');
  const [members] = useLocalStorage('kl_members', []);

  // Personlig dashboard: /bjorn, /tove osv. — matchar medlemsnamn (utan åäö-krav:
  // "björn" nås som både /björn och /bjorn).
  const slug = decodeURIComponent(window.location.pathname.slice(1)).toLowerCase();
  if (slug) {
    const fold = s => s.toLowerCase().replace(/å|ä/g, 'a').replace(/ö/g, 'o');
    const member = members.find(m => fold(m.name) === fold(slug));
    if (member) return <ProfilVy member={member} />;
  }

  return design === 'familjen' ? <FamiljeDashboard /> : <KlaraLayout />;
}

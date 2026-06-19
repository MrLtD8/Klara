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

export default function App() {
  const [design] = useLocalStorage('app_design', 'klara');
  return design === 'familjen' ? <FamiljeDashboard /> : <KlaraLayout />;
}

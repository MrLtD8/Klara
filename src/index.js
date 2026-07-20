// ─────────────────────────────────────────────────────────────
//  FamiljePlan — Startpunkt
//
//  Vanlig app (iPad/desktop): http://localhost:3000
//  Mobilvy (telefon):         automatisk vid smal skärm
//  Testplattform:             http://localhost:3000?test
//
//  Detektering:
//    - ?test i URL              → testplattform
//    - ?mobile i URL            → tvinga mobilvy
//    - ?desktop i URL           → tvinga desktopvy
//    - Skärm < 640px bred       → mobilvy
//    - Annars                   → dashboard
// ─────────────────────────────────────────────────────────────
import React from 'react';
import ReactDOM from 'react-dom/client';

const params = window.location.search;
const isTestMode   = params.includes('test');
const forceMobile  = params.includes('mobile');
const forceDesktop = params.includes('desktop');

// Telefon = smalare än 640px OCH inte tvingad till desktop
const isMobile = !forceDesktop && (forceMobile || window.innerWidth < 640);

// Vald design (synk-nyckeln 'app_design', JSON-kodad av useLocalStorage).
// Klara har egen responsiv mobilvy; bara Familjen använder familjeapp-mobile.
function getDesign() {
  try {
    const raw = localStorage.getItem('app_design');
    return raw ? JSON.parse(raw) : 'klara';
  } catch {
    return 'klara';
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

if (isTestMode) {
  import('./familjeplan-testplatform').then(({ default: TestApp }) => {
    root.render(<TestApp />);
  });
} else if (isMobile && getDesign() === 'familjen') {
  import('./familjeapp-mobile').then(({ default: MobileApp }) => {
    root.render(<MobileApp />);
  });
} else {
  // Desktop (båda designerna) + mobil för Klara → App väljer och renderar
  // rätt design, Klara-layouten är själv responsiv.
  import('./App').then(({ default: App }) => {
    root.render(<App />);
  });
}

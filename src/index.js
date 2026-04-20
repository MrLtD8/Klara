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
import { AuthProvider } from './useAuth';
import { AuthGate } from './AuthGate';

const params = window.location.search;
const isTestMode   = params.includes('test');
const forceMobile  = params.includes('mobile');
const forceDesktop = params.includes('desktop');

// Telefon = smalare än 640px OCH inte tvingad till desktop
const isMobile = !forceDesktop && (forceMobile || window.innerWidth < 640);

const root = ReactDOM.createRoot(document.getElementById('root'));

function withAuth(AppComponent) {
  return (
    <AuthProvider>
      <AuthGate>
        <AppComponent />
      </AuthGate>
    </AuthProvider>
  );
}

if (isTestMode) {
  import('./familjeplan-testplatform').then(({ default: TestApp }) => {
    root.render(withAuth(TestApp));
  });
} else if (isMobile) {
  import('./familjeapp-mobile').then(({ default: MobileApp }) => {
    root.render(withAuth(MobileApp));
  });
} else {
  import('./App').then(({ default: App }) => {
    root.render(withAuth(App));
  });
}

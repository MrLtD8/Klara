// ─────────────────────────────────────────────────────────────
//  FamiljePlan — Startpunkt
//
//  Vanlig app:     http://localhost:3000
//  Testplattform:  http://localhost:3000?test
// ─────────────────────────────────────────────────────────────
import React from 'react';
import ReactDOM from 'react-dom/client';

const isTestMode = window.location.search.includes('test');

const root = ReactDOM.createRoot(document.getElementById('root'));

if (isTestMode) {
  import('./familjeplan-testplatform').then(({ default: TestApp }) => {
    root.render(<TestApp />);
  });
} else {
  import('./App').then(({ default: App }) => {
    root.render(<App />);
  });
}

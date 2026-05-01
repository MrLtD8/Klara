import React, { useState } from 'react';
import { useAuth } from './useAuth';

// ─── Färger (matchar Klara-temat) ─────────────────────────────────────────────
const C = {
  purple:      '#7C5CBF',
  purpleDark:  '#5B3FA0',
  purpleLight: '#F0EBFD',
  sidebar:     '#1E1B3A',
  sidebarMid:  '#2A2550',
  text:        '#1A1A2E',
  muted:       '#6B7280',
  border:      '#E5E7EB',
  red:         '#EF4444',
  green:       '#22C55E',
  bg:          '#F8F7FF',
  white:       '#FFFFFF',
};

// ─── Google-ikon (officiella färger) ─────────────────────────────────────────
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

// ─── Google-knapp ─────────────────────────────────────────────────────────────
function GoogleButton({ isLocalMode }) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hov, setHov] = useState(false);

  async function handleClick() {
    setLoading(true);
    const err = await signInWithGoogle();
    if (err) {
      console.error('Google sign-in error:', err);
      setLoading(false);
    }
    // Om riktig Supabase: sidan redirectas till Google — loading behöver inte stoppas
    // Om lokal mock: onAuthStateChange triggas direkt → AuthGate byter till app
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '11px 16px',
        background: hov ? '#f5f5f5' : C.white,
        border: `1.5px solid ${C.border}`,
        borderRadius: 10,
        fontSize: 15, fontWeight: 600, color: '#3c4043',
        cursor: loading ? 'default' : 'pointer',
        transition: 'background 0.15s',
        opacity: loading ? 0.7 : 1,
        fontFamily: "'Roboto', 'Inter', system-ui, sans-serif",
      }}
    >
      {loading
        ? <span style={{ fontSize: 13, color: C.muted }}>Ansluter till Google…</span>
        : <>
            <GoogleIcon size={18} />
            Fortsätt med Google
            {isLocalMode && <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>(mock)</span>}
          </>
      }
    </button>
  );
}

// ─── Avdelare ─────────────────────────────────────────────────────────────────
function Divider({ label = 'eller' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

// ─── Hjälpkomponent: inputfält ────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, autoFocus, hint, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '11px 14px',
          border: `1.5px solid ${error ? C.red : focused ? C.purple : C.border}`,
          borderRadius: 10, fontSize: 15, color: C.text,
          outline: 'none', background: C.white,
          transition: 'border-color 0.15s',
        }}
      />
      {hint && !error && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

// ─── Lösenordsstyrka ──────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['', C.red, '#F97316', '#F59E0B', C.green];
  const labels = ['', 'Svagt', 'Okej', 'Bra', 'Starkt'];
  return (
    <div style={{ marginTop: -10, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: score >= i ? colors[score] : C.border, transition: 'background 0.3s' }} />
        ))}
      </div>
      {score > 0 && (
        <div style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</div>
      )}
    </div>
  );
}

// ─── Inloggningsvyn ───────────────────────────────────────────────────────────
function LoginForm({ onSwitch, onForgot, isLocalMode }) {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Fyll i alla fält.'); return; }
    setError(''); setLoading(true);
    const err = await signIn(email.trim(), password);
    if (err) setError(err.message);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Google-knapp */}
      <GoogleButton isLocalMode={isLocalMode} />
      <Divider />

      <Field label="E-postadress" type="email" value={email} onChange={setEmail} placeholder="du@exempel.se" autoFocus />
      <Field label="Lösenord" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.red, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ width: '100%', padding: '12px 0', background: loading ? C.muted : C.purple, color: C.white, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', marginBottom: 12, transition: 'background 0.15s' }}
      >
        {loading ? 'Loggar in…' : 'Logga in'}
      </button>

      <button
        type="button"
        onClick={onForgot}
        style={{ width: '100%', background: 'none', border: 'none', color: C.purple, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}
      >
        Glömt lösenordet?
      </button>

      <div style={{ textAlign: 'center', paddingTop: 16, borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
        <span style={{ fontSize: 13, color: C.muted }}>Inget konto? </span>
        <button type="button" onClick={onSwitch} style={{ background: 'none', border: 'none', color: C.purple, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Registrera dig gratis
        </button>
      </div>
    </form>
  );
}

// ─── Registreringsvyn ─────────────────────────────────────────────────────────
function RegisterForm({ onSwitch, isLocalMode }) {
  const { signUp } = useAuth();
  const [name, setName]           = useState('');
  const [familyName, setFamName]  = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Obligatoriskt';
    if (!email.trim()) e.email = 'Obligatoriskt';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Ogiltig e-postadress';
    if (password.length < 8) e.password = 'Minst 8 tecken';
    if (password !== confirm) e.confirm = 'Lösenorden stämmer inte överens';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    const err = await signUp(email.trim(), password, name.trim(), familyName.trim() || 'Vår familj');
    if (err) {
      setErrors({ submit: err.message });
    } else {
      // I lokal läge loggas man in direkt; i produktion behövs e-postbekräftelse
      if (!isLocalMode) setDone(true);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h3 style={{ margin: '0 0 10px', color: C.text, fontWeight: 700 }}>Kolla din e-post!</h3>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
          Vi har skickat en bekräftelselänk till <strong>{email}</strong>. Klicka på länken för att aktivera ditt konto.
        </p>
        <button onClick={onSwitch} style={{ background: C.purple, color: C.white, border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Till inloggning
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Google-knapp */}
      <GoogleButton isLocalMode={isLocalMode} />
      <Divider label="eller registrera med e-post" />

      <Field label="Ditt namn" value={name} onChange={setName} placeholder="Björn Landerstedt" autoFocus error={errors.name} />
      <Field label="Familjens namn" value={familyName} onChange={setFamName} placeholder="Familjen Landerstedt" hint="Visas i appen — kan ändras senare" />
      <Field label="E-postadress" type="email" value={email} onChange={setEmail} placeholder="du@exempel.se" error={errors.email} />
      <Field label="Lösenord" type="password" value={password} onChange={setPassword} placeholder="Minst 8 tecken" hint="Rekommenderat: stora+små bokstäver, siffra och tecken" error={errors.password} />
      <PasswordStrength password={password} />
      <Field label="Bekräfta lösenord" type="password" value={confirm} onChange={setConfirm} placeholder="Upprepa lösenordet" error={errors.confirm} />

      {errors.submit && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.red, marginBottom: 16 }}>
          {errors.submit}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ width: '100%', padding: '12px 0', background: loading ? C.muted : C.purple, color: C.white, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', marginBottom: 12 }}
      >
        {loading ? 'Skapar konto…' : 'Skapa konto'}
      </button>

      <div style={{ textAlign: 'center', paddingTop: 16, borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
        <span style={{ fontSize: 13, color: C.muted }}>Har du redan ett konto? </span>
        <button type="button" onClick={onSwitch} style={{ background: 'none', border: 'none', color: C.purple, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Logga in
        </button>
      </div>
    </form>
  );
}

// ─── Glömt lösenord ───────────────────────────────────────────────────────────
function ForgotForm({ onBack, isLocalMode }) {
  const { resetPassword } = useAuth();
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Fyll i din e-postadress.'); return; }
    setError(''); setLoading(true);
    const err = await resetPassword(email.trim());
    if (err) setError(err.message);
    else setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h3 style={{ margin: '0 0 10px', color: C.text, fontWeight: 700 }}>
          {isLocalMode ? 'Lokalt läge' : 'Mejl skickat!'}
        </h3>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
          {isLocalMode
            ? 'I lokalt läge kan inga mejl skickas. Kontakta en administratör eller skapa ett nytt konto.'
            : `Vi har skickat instruktioner till ${email}. Kolla din inkorg (och skräppost).`}
        </p>
        <button onClick={onBack} style={{ background: C.purple, color: C.white, border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          ← Till inloggning
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
        Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
      </p>
      <Field label="E-postadress" type="email" value={email} onChange={setEmail} placeholder="du@exempel.se" autoFocus error={error} />
      <button
        type="submit"
        disabled={loading}
        style={{ width: '100%', padding: '12px 0', background: C.purple, color: C.white, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}
      >
        {loading ? 'Skickar…' : 'Skicka återställningslänk'}
      </button>
      <button type="button" onClick={onBack} style={{ width: '100%', background: 'none', border: 'none', color: C.purple, fontSize: 13, cursor: 'pointer' }}>
        ← Tillbaka till inloggning
      </button>
    </form>
  );
}

// ─── Laddningsskärm ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.sidebar }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.white, letterSpacing: '-1px', marginBottom: 20 }}>
          Klara<span style={{ color: C.purple }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: C.purple,
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.7,
            }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Huvud auth-skärm ─────────────────────────────────────────────────────────
function AuthScreen() {
  const { isLocalMode } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(145deg, ${C.sidebar} 0%, #2D1B69 45%, ${C.sidebarMid} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: C.white, letterSpacing: '-1.5px', lineHeight: 1 }}>
            Klara<span style={{ color: C.purple }}>.</span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 8, fontWeight: 400 }}>
            Familjeplanering samlad på ett ställe
          </div>
        </div>

        {/* Kortet */}
        <div style={{
          background: C.white, borderRadius: 20,
          padding: '32px 36px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.15)',
        }}>
          {/* Vyväljare (bara login/register, ej forgot) */}
          {view !== 'forgot' && (
            <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: C.bg, borderRadius: 10, padding: 4 }}>
              {[['login','Logga in'],['register','Registrera']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  style={{
                    flex: 1, padding: '9px 0', border: 'none', borderRadius: 7,
                    background: view === id ? C.white : 'transparent',
                    color: view === id ? C.text : C.muted,
                    fontWeight: view === id ? 700 : 400,
                    fontSize: 14, cursor: 'pointer',
                    boxShadow: view === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Vy-titel vid forgot */}
          {view === 'forgot' && (
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: C.text }}>Återställ lösenord</h2>
          )}

          {/* Formulär */}
          {view === 'login'    && <LoginForm    onSwitch={() => setView('register')} onForgot={() => setView('forgot')} isLocalMode={isLocalMode} />}
          {view === 'register' && <RegisterForm onSwitch={() => setView('login')} isLocalMode={isLocalMode} />}
          {view === 'forgot'   && <ForgotForm   onBack={() => setView('login')} isLocalMode={isLocalMode} />}
        </div>

        {/* Lokal-läge-indikator */}
        {isLocalMode && (
          <div style={{
            marginTop: 16, textAlign: 'center', fontSize: 12,
            color: 'rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
            Lokalt läge — data sparas i webbläsaren, inte på server
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Klara v2.0 · Data skyddas med branschstandard-säkerhet
        </div>
      </div>
    </div>
  );
}

// ─── AuthGate — exporteras och wrappas runt hela appen ───────────────────────
export function AuthGate({ children }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  return children;
}

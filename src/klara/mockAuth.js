// ─── Lokal mock-autentisering ─────────────────────────────────────────────────
// Används när REACT_APP_SUPABASE_URL inte är konfigurerat.
// Exakt samma API-form som Supabase auth — byt bara ut importen i useAuth.js.
//
// OBS: Lösenord sparas i klartext i localStorage — ENDAST för lokal dev.
// I produktion hanteras hashning av Supabase (bcrypt).

const USERS_KEY   = 'klara_mock_users';
const SESSION_KEY = 'klara_mock_session';

// ─── Hjälpare ─────────────────────────────────────────────────────────────────
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

function getStoredSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
function saveSession(s) {
  localStorage.setItem(SESSION_KEY, s ? JSON.stringify(s) : 'null');
}

function makeSession(user) {
  return {
    access_token: 'mock_' + user.id + '_' + Date.now(),
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id:             user.id,
      email:          user.email,
      user_metadata:  {
        full_name:    user.name,
        family_name:  user.familyName,
      },
      created_at: user.createdAt,
    },
  };
}

// ─── Enkel event-emitter för onAuthStateChange ────────────────────────────────
const listeners = [];
function notify(event, session) {
  listeners.forEach(cb => { try { cb(event, session); } catch {} });
}

// ─── Mock auth-objekt (matchar supabase.auth.*) ───────────────────────────────
export const mockAuth = {

  // Hämta aktuell session
  getSession: async () => {
    const session = getStoredSession();
    // Kolla om session löpt ut
    if (session && session.expires_at < Math.floor(Date.now() / 1000)) {
      saveSession(null);
      return { data: { session: null }, error: null };
    }
    return { data: { session }, error: null };
  },

  // Logga in med e-post + lösenord
  signInWithPassword: async ({ email, password }) => {
    await delay(400); // simulera nätverksanrop
    const users = getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );
    if (!user) {
      return { data: null, error: { message: 'Felaktig e-postadress eller lösenord.' } };
    }
    const session = makeSession(user);
    saveSession(session);
    notify('SIGNED_IN', session);
    return { data: { session, user: session.user }, error: null };
  },

  // Registrera nytt konto
  signUp: async ({ email, password, options }) => {
    await delay(500);
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return { data: null, error: { message: 'E-postadressen används redan av ett annat konto.' } };
    }
    const user = {
      id:         'mock_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      email:      email.toLowerCase().trim(),
      password,   // klartext — lokal dev ONLY
      name:       options?.data?.full_name || email.split('@')[0],
      familyName: options?.data?.family_name || 'Vår familj',
      createdAt:  new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    const session = makeSession(user);
    saveSession(session);
    notify('SIGNED_IN', session);
    return { data: { user: session.user, session }, error: null };
  },

  // Logga ut
  signOut: async () => {
    await delay(200);
    saveSession(null);
    notify('SIGNED_OUT', null);
    return { error: null };
  },

  // Återställ lösenord (lokal: låtsas att mejl skickats)
  resetPasswordForEmail: async (_email, _options) => {
    await delay(600);
    // I lokal läge: inget mejl kan skickas — vi visar bara ett info-meddelande
    return { error: null };
  },

  // Lyssna på auth-ändringar
  onAuthStateChange: (callback) => {
    listeners.push(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const i = listeners.indexOf(callback);
            if (i > -1) listeners.splice(i, 1);
          },
        },
      },
    };
  },

  // OAuth (Google etc.) — simuleras lokalt med en fake Google-användare
  signInWithOAuth: async ({ provider }) => {
    await delay(600);
    if (provider !== 'google') {
      return { data: null, error: { message: `Provider "${provider}" stöds inte i lokalt läge.` } };
    }
    // Skapa/återanvänd en mock-Google-användare
    const mockEmail = 'mock.google@gmail.com';
    const users = getUsers();
    let user = users.find(u => u.email === mockEmail);
    if (!user) {
      user = {
        id: 'mock_google_' + Date.now(),
        email: mockEmail,
        password: null,
        name: 'Google Användare',
        familyName: 'Vår familj',
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      saveUsers(users);
    }
    const session = makeSession(user);
    saveSession(session);
    notify('SIGNED_IN', session);
    // I riktig Supabase öppnas ett popup/redirect — här "returnerar" vi direkt
    return { data: { provider, url: null }, error: null };
  },

  // Uppdatera lösenord (används vid glömt lösenord — lokal: hittar user och ändrar)
  updateUser: async ({ password }) => {
    await delay(400);
    const session = getStoredSession();
    if (!session) return { error: { message: 'Inte inloggad' } };
    const users = getUsers();
    const idx = users.findIndex(u => u.id === session.user.id);
    if (idx < 0) return { error: { message: 'Användaren hittades inte' } };
    users[idx].password = password;
    saveUsers(users);
    return { data: { user: session.user }, error: null };
  },
};

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

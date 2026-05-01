import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './supabase';
import { mockAuth } from './klara/mockAuth';

// ─── Välj auth-backend: Supabase om konfigurerat, annars lokal mock ───────────
const auth = supabase ? supabase.auth : mockAuth;
export const isLocalMode = !supabase;

// ─── Kontext ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = laddar
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hämta befintlig session
    auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      setLoading(false);
    });

    // Lyssna på ändringar (login/logout)
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth-funktioner ─────────────────────────────────────────────────────────
  async function signIn(email, password) {
    const { error } = await auth.signInWithPassword({ email, password });
    return error ?? null;
  }

  async function signUp(email, password, fullName, familyName) {
    const { error } = await auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, family_name: familyName },
        // I produktion: emailRedirectTo: window.location.origin
      },
    });
    return error ?? null;
  }

  async function signOut() {
    await auth.signOut();
  }

  async function resetPassword(email) {
    const { error } = await auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    return error ?? null;
  }

  async function signInWithGoogle() {
    const { error } = await auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',  // ger refresh_token
          prompt: 'consent',
        },
      },
    });
    return error ?? null;
  }

  // ── Härledd state ──────────────────────────────────────────────────────────
  const user = session?.user ?? null;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Användare';
  const familyName = user?.user_metadata?.family_name || 'Vår familj';
  const userInitials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      isLocalMode,
      userName,
      familyName,
      userInitials,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth måste användas inuti AuthProvider');
  return ctx;
}

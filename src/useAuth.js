import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!supabase) return; // Lokal läge utan Supabase

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, family_id")
      .eq("id", userId)
      .single();
    setProfile(data);
  }

  async function signInWithEmail(email, password) {
    if (!supabase) return new Error("Supabase ej konfigurerat");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }

  async function signUpWithEmail(email, password, displayName) {
    if (!supabase) return new Error("Supabase ej konfigurerat");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error;
    await supabase.from("profiles").insert({ id: data.user.id, display_name: displayName });
    return null;
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, profile, signInWithEmail, signUpWithEmail, signOut, isLocalMode: !supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

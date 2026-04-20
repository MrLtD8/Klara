import { useState } from "react";
import { useAuth } from "./useAuth";

export function AuthGate({ children }) {
  const { session, isLocalMode } = useAuth();

  // Lokalt läge utan Supabase — visa appen direkt
  if (isLocalMode) return children;
  if (session === null) return <AuthScreen />;
  return children;
}

function LoadingScreen() {
  return (
    <div style={styles.center}>
      <p style={styles.muted}>Laddar…</p>
    </div>
  );
}

function AuthScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let err;
    if (mode === "login") {
      err = await signInWithEmail(email, password);
    } else {
      err = await signUpWithEmail(email, password, name);
      if (!err) setDone(true);
    }

    if (err) setError(err.message);
    setLoading(false);
  }

  if (done) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h2 style={styles.title}>Kolla din e-post!</h2>
          <p style={styles.muted}>Vi har skickat en bekräftelselänk till {email}.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.center}>
      <div style={styles.card}>
        <h1 style={styles.logo}>FamiljeApp</h1>
        <h2 style={styles.title}>{mode === "login" ? "Logga in" : "Skapa konto"}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "signup" && (
            <input
              style={styles.input}
              type="text"
              placeholder="Ditt namn"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="E-postadress"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "…" : mode === "login" ? "Logga in" : "Registrera"}
          </button>
        </form>

        <button style={styles.toggle} onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(null); }}>
          {mode === "login" ? "Inget konto? Registrera dig" : "Har du konto? Logga in"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f5f3ff" },
  card: { background: "#fff", borderRadius: 16, padding: "40px 36px", maxWidth: 380, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  logo: { margin: "0 0 4px", fontSize: 22, color: "#6B4EA8", fontWeight: 700 },
  title: { margin: "0 0 24px", fontSize: 18, fontWeight: 600, color: "#1a1a2e" },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e0daf5", fontSize: 15, outline: "none" },
  button: { padding: "11px 0", borderRadius: 8, border: "none", background: "#6B4EA8", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4 },
  toggle: { marginTop: 16, background: "none", border: "none", color: "#6B4EA8", cursor: "pointer", fontSize: 14, width: "100%" },
  error: { color: "#c0392b", fontSize: 13, margin: 0 },
  muted: { color: "#888", fontSize: 15 },
};

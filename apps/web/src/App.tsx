
import { useEffect, useState } from "react";
import {
  signIn,
  signOut,
  verifyStaffAccess,
} from "./lib/auth";
import { supabase } from "./lib/supabase";

type PortalState = "loading" | "login" | "dashboard";

export default function App() {
  const [page, setPage] = useState<PortalState>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        await verifyStaffAccess();

        const { data } = await supabase.auth.getUser();

        if (active) {
          setCurrentEmail(data.user?.email || "");
          setPage("dashboard");
        }
      } catch {
        if (active) setPage("login");
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        setMessage(error.message);
        return;
      }

      try {
        await verifyStaffAccess();
      } catch (accessError) {
        await signOut();
        throw accessError;
      }

      setCurrentEmail(data.user?.email || "");
      setPage("dashboard");
      setPassword("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);

    try {
      const { error } = await signOut();

      if (error) throw error;

      setPage("login");
      setCurrentEmail("");
      setPassword("");
      setMessage("");
    } catch {
      setMessage("Unable to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (page === "loading") {
    return (
      <main style={styles.center}>
        <p>Verifying GYNECAIRE staff access...</p>
      </main>
    );
  }

  if (page === "dashboard") {
    return (
      <main style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1>GYNECAIRE</h1>
            <p>Staff Management Portal</p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            style={styles.button}
          >
            Sign Out
          </button>
        </header>

        <section style={styles.card}>
          <h2>Welcome to GYNECAIRE</h2>
          <p>Signed in as: {currentEmail}</p>
          <p>
            Your staff account has been verified by the
            GYNECAIRE backend.
          </p>
        </section>

        <section style={styles.card}>
          <h3>Dashboard foundation</h3>
          <p>
            Patient management, appointments, clinical
            records, inventory, and reporting will be
            connected here after their APIs are secured.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.center}>
      <section style={styles.loginCard}>
        <h1>GYNECAIRE</h1>
        <p>Authorized Staff Portal</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="username"
              style={styles.input}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              autoComplete="current-password"
              style={styles.input}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        {message && (
          <p role="alert" style={styles.error}>
            {message}
          </p>
        )}

        <p style={styles.note}>
          This portal is restricted to authorized
          clinic personnel.
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f7f8",
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  container: {
    minHeight: "100vh",
    background: "#f3f7f8",
    padding: 32,
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  loginCard: {
    width: "100%",
    maxWidth: 420,
    background: "white",
    borderRadius: 20,
    padding: 32,
    boxShadow: "0 12px 40px rgba(0,0,0,0.07)",
  },
  form: {
    display: "grid",
    gap: 18,
    marginTop: 28,
  },
  input: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    marginTop: 8,
    padding: 12,
    border: "1px solid #d5dfe1",
    borderRadius: 10,
  },
  button: {
    padding: "12px 20px",
    background: "#176b68",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  card: {
    background: "white",
    padding: 28,
    borderRadius: 18,
    marginBottom: 20,
  },
  error: {
    color: "#b42318",
    marginTop: 16,
  },
  note: {
    color: "#687b80",
    fontSize: 13,
    marginTop: 24,
  },
};

import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={rootStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>
          <span style={{ color: "#22c55e", fontSize: 24 }}>&#9654;</span>
          <span style={{ fontSize: 20, fontWeight: 600, color: "#fafafa" }}>Broadcast</span>
        </div>

        <p style={{ color: "#71717a", fontSize: 14, margin: "0 0 24px", textAlign: "center" }}>
          Masuk untuk menonton siaran
        </p>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Username atau Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username atau email"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...buttonStyle,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f0f0f",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const cardStyle: React.CSSProperties = {
  width: 360,
  padding: "40px 32px",
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 12,
};

const logoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  marginBottom: 8,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#a1a1aa",
  marginBottom: 6,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#0f0f0f",
  border: "1px solid #27272a",
  borderRadius: 6,
  color: "#e4e4e7",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  background: "#22c55e",
  border: "none",
  borderRadius: 6,
  color: "#000",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const errorStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "rgba(239, 68, 68, 0.15)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: 6,
  color: "#ef4444",
  fontSize: 13,
  marginBottom: 16,
};

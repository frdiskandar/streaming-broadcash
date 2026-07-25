import { useState, useEffect } from "react";
import Player from "./components/Player";
import AdminDashboard from "./components/AdminDashboard";
import LoginPage from "./components/LoginPage";
import { AuthProvider, useAuth } from "./components/AuthContext";

interface Stream {
  streamKey: string;
  isLive: boolean;
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    function onPop() {
      setPathname(window.location.pathname);
    }
    window.addEventListener("popstate", onPop);

    const orig = history.pushState;
    history.pushState = function (...args) {
      orig.apply(this, args);
      setPathname(window.location.pathname);
    };
    return () => {
      window.removeEventListener("popstate", onPop);
      history.pushState = orig;
    };
  }, []);

  return pathname;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#8987;</div>
        <p style={{ color: "#999", fontSize: 16 }}>Memuat...</p>
      </div>
    );
  }

  // Admin routes — admin only
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!user) return <LoginPage />;
    if (user.role !== "admin") {
      return (
        <div style={loadingStyle}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>&#128274;</div>
          <p style={{ color: "#ef4444", fontSize: 16, marginBottom: 8 }}>Akses Ditolak</p>
          <p style={{ color: "#71717a", fontSize: 14 }}>Anda tidak memiliki akses ke halaman ini</p>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{ marginTop: 20, padding: "8px 16px", background: "#27272a", border: "none", borderRadius: 6, color: "#e4e4e7", fontSize: 13, cursor: "pointer" }}
          >
            Kembali ke Viewer
          </button>
        </div>
      );
    }
    return <AdminDashboard />;
  }

  // Viewer — login required
  if (!user) {
    return <LoginPage />;
  }

  return <ViewerApp />;
}

function ViewerApp() {
  const { logout } = useAuth();
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkStream();
    const interval = setInterval(checkStream, 3000);
    return () => clearInterval(interval);
  }, []);

  async function checkStream() {
    try {
      const res = await fetch("/api/streams");
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      const live = data.streams.find((s: Stream) => s.isLive);
      if (live) {
        setActiveStream(live);
      } else {
        setActiveStream(null);
      }
    } catch {
      setActiveStream(null);
    } finally {
      setChecking(false);
    }
  }

  if (checking) {
    return (
      <div style={viewerContainerStyle}>
        <div style={offlineBoxStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#8987;</div>
          <p style={{ color: "#999", fontSize: 16 }}>Memeriksa stream...</p>
        </div>
      </div>
    );
  }

  if (!activeStream) {
    return (
      <div style={viewerContainerStyle}>
        <div style={offlineBoxStyle}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>&#9210;</div>
          <h2 style={{ color: "#555", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Tidak Ada Siaran
          </h2>
          <p style={{ color: "#999", fontSize: 14, lineHeight: 1.6, textAlign: "center", maxWidth: 360 }}>
            Stream akan muncul secara otomatis saat broadcaster memulai siaran dari OBS ke{" "}
            <code style={codeStyle}>rtmp://localhost:1935/live</code>
          </p>
          <div style={{ marginTop: 24, padding: "8px 16px", background: "#f0f0f0", borderRadius: 6, fontSize: 12, color: "#888" }}>
            Menunggu siaran...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Player streamKey={activeStream.streamKey} />
    </div>
  );
}

const loadingStyle: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f0f0f",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const viewerContainerStyle: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f0f0f",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const offlineBoxStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 48,
};

const codeStyle: React.CSSProperties = {
  background: "#222",
  color: "#aaa",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 13,
};

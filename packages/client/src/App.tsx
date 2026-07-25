import { useState, useEffect } from "react";
import Player from "./components/Player";
import AdminDashboard from "./components/AdminDashboard";

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
  const pathname = usePathname();

  if (pathname === "/admin") {
    return <AdminDashboard />;
  }

  return <ViewerApp />;
}

function ViewerApp() {
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
      <div style={containerStyle}>
        <div style={offlineBoxStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#8987;</div>
          <p style={{ color: "#999", fontSize: 16 }}>Memeriksa stream...</p>
        </div>
      </div>
    );
  }

  if (!activeStream) {
    return (
      <div style={containerStyle}>
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
    <div style={containerStyle}>
      <Player streamKey={activeStream.streamKey} />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  width: "100vw",
  height: "100vh",
  margin: 0,
  padding: 0,
  background: "#111",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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

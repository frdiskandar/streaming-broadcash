import { useState, useEffect, useRef } from "react";
import type { Viewer } from "@broadcast/shared";

function formatDate(ts?: number): string {
  if (!ts) return "-";
  const diff = Date.now() - ts;
  if (diff < 60000) return "Baru saja";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ViewerManagement() {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalVolume, setGlobalVolume] = useState(100);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsHost = `ws://${window.location.hostname}:8081`;
    const ws = new WebSocket(`${wsHost}?role=admin`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "viewer_list") {
        setViewers(msg.payload.viewers || []);
        setLoading(false);
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  function sendAdminSetVolume(viewerId: string, volume: number) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "admin_set_volume",
        payload: { viewerId, volume },
      }));
    }
  }

  function sendAdminSetAllVolume(volume: number) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "admin_set_all_volume",
        payload: { volume },
      }));
    }
  }

  const watchingViewers = viewers.filter((v) => v.isWatching);
  const offlineViewers = viewers.filter((v) => !v.isWatching);
  const sortedViewers = [...watchingViewers, ...offlineViewers];

  if (loading) {
    return <div style={{ padding: 24, color: "#71717a" }}>Memuat data viewer...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e4e4e7", margin: 0 }}>
            Viewers ({viewers.length})
          </h2>
          <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0" }}>
            {watchingViewers.length} menonton aktif
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#71717a" }}>Set All Volume:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={globalVolume}
            onChange={(e) => {
              const val = Number(e.target.value);
              setGlobalVolume(val);
              sendAdminSetAllVolume(val);
            }}
            style={sliderStyle}
          />
          <span style={{ fontSize: 12, color: "#a1a1aa", minWidth: 32, textAlign: "center", fontFamily: "monospace" }}>
            {globalVolume}%
          </span>
        </div>
      </div>

      {sortedViewers.length === 0 ? (
        <div style={emptyStyle}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>&#128100;</div>
          <p style={{ color: "#71717a", fontSize: 14, margin: 0 }}>Belum ada viewer</p>
        </div>
      ) : (
        <div style={gridStyle}>
          {sortedViewers.map((viewer) => (
            <div key={viewer.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7" }}>{viewer.username}</div>
                  <div style={{ fontSize: 11, color: "#52525b", fontFamily: "monospace", marginTop: 2 }}>{viewer.id}</div>
                </div>
                <span style={viewer.isWatching ? activeBadgeStyle : inactiveBadgeStyle}>
                  {viewer.isWatching ? "Menonton" : "Offline"}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Stream</span>
                  <code style={infoValueStyle}>{viewer.streamKey}</code>
                </div>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Terakhir Aktif</span>
                  <span style={infoValueStyle}>{formatDate(viewer.lastActiveAt)}</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Terhubung</span>
                  <span style={infoValueStyle}>{formatDate(viewer.connectedAt)}</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #27272a", paddingTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#71717a" }}>Volume:</span>
                  <span style={{ fontSize: 11, color: "#a1a1aa", fontFamily: "monospace", marginLeft: "auto" }}>
                    {viewer.volume}%
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{viewer.volume === 0 ? "\u{1F507}" : viewer.volume < 50 ? "\u{1F509}" : "\u{1F50A}"}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={viewer.volume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      sendAdminSetVolume(viewer.id, val);
                    }}
                    style={{ ...sliderStyle, flex: 1 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  padding: 16,
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
};

const emptyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 24px",
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
  textAlign: "center",
};

const activeBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  background: "rgba(34, 197, 94, 0.15)",
  color: "#22c55e",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
};

const inactiveBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  background: "rgba(113, 113, 122, 0.15)",
  color: "#71717a",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
};

const infoRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#71717a",
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#a1a1aa",
  fontFamily: "'SF Mono', Consolas, monospace",
};

const sliderStyle: React.CSSProperties = {
  width: 100,
  height: 4,
  appearance: "none",
  WebkitAppearance: "none",
  background: "rgba(255,255,255,0.3)",
  borderRadius: 2,
  outline: "none",
  cursor: "pointer",
};

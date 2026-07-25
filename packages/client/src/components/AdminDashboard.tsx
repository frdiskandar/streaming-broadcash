import { useState, useEffect } from "react";
import UserManagement from "./UserManagement";
import { useAuth } from "./AuthContext";

interface Stream {
  streamKey: string;
  isLive: boolean;
  viewerCount: number;
  startedAt?: number;
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatDuration(startedAt: number): string {
  const elapsed = Date.now() - startedAt;
  return formatUptime(elapsed);
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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [serverStartTime] = useState(Date.now());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const activeTab = pathname === "/admin/users" ? "users" : "dashboard";

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStreams() {
    try {
      const res = await fetch("/api/streams");
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      setStreams(data.streams || []);
      setLastUpdate(new Date());
    } catch {
      setStreams([]);
    }
  }

  const totalViewers = streams.reduce((sum, s) => sum + (s.viewerCount || 0), 0);
  const liveStreams = streams.filter((s) => s.isLive);

  return (
    <div style={rootStyle}>
      <aside style={sidebarStyle}>
        <div style={logoStyle}>
          <span style={logoIconStyle}>&#9654;</span>
          <span>Broadcast</span>
        </div>

        <nav style={navStyle}>
          <a
            href="/admin"
            style={{ ...navItemStyle, ...(activeTab === "dashboard" ? navItemActiveStyle : {}) }}
          >
            <span style={navIconStyle}>&#9632;</span>
            Dashboard
          </a>
          <a
            href="/admin/users"
            style={{ ...navItemStyle, ...(activeTab === "users" ? navItemActiveStyle : {}) }}
          >
            <span style={navIconStyle}>&#9775;</span>
            Pengguna
          </a>
        </nav>

        <div style={sidebarFooterStyle}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={statusDotStyle} />
              <span style={{ fontSize: 12, color: "#71717a" }}>Server Online</span>
            </div>
            {user && (
              <div style={{ fontSize: 11, color: "#52525b", paddingLeft: 16 }}>
                {user.username} ({user.role})
              </div>
            )}
          </div>
          <button onClick={logout} style={logoutBtnStyle}>
            Keluar
          </button>
        </div>
      </aside>

      <main style={mainStyle}>
        {activeTab === "users" ? (
          <UserManagement />
        ) : (
          <>
            <header style={headerStyle}>
              <div>
                <h1 style={titleStyle}>Dashboard</h1>
                <p style={subtitleStyle}>Monitor siaran dan server Anda</p>
              </div>
              <div style={headerRightStyle}>
                <span style={timestampStyle}>Update: {lastUpdate.toLocaleTimeString("id-ID")}</span>
              </div>
            </header>

            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Status Siaran</div>
                <div style={statValueStyle}>
                  <span style={{ color: liveStreams.length > 0 ? "#22c55e" : "#71717a" }}>
                    {liveStreams.length > 0 ? "LIVE" : "OFFLINE"}
                  </span>
                </div>
                <div style={statSubStyle}>{liveStreams.length} stream aktif</div>
              </div>

              <div style={statCardStyle}>
                <div style={statLabelStyle}>Total Penonton</div>
                <div style={statValueStyle}>{totalViewers}</div>
                <div style={statSubStyle}>penonton terhubung</div>
              </div>

              <div style={statCardStyle}>
                <div style={statLabelStyle}>Uptime Server</div>
                <div style={statValueStyle}>{formatUptime(Date.now() - serverStartTime)}</div>
                <div style={statSubStyle}>sejak server dimulai</div>
              </div>

              <div style={statCardStyle}>
                <div style={statLabelStyle}>RTMP Port</div>
                <div style={{ ...statValueStyle, fontFamily: "'SF Mono', 'Cascadia Code', Consolas, monospace" }}>
                  1935
                </div>
                <div style={statSubStyle}>OBS stream endpoint</div>
              </div>
            </div>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Siaran Aktif</h2>

              {liveStreams.length === 0 ? (
                <div style={emptyStateStyle}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>&#9210;</div>
                  <p style={{ color: "#71717a", fontSize: 14, margin: 0 }}>
                    Tidak ada siaran aktif saat ini
                  </p>
                  <p style={{ color: "#52525b", fontSize: 12, margin: "8px 0 0" }}>
                    Mulai siaran dari OBS ke rtmp://localhost:1935/live
                  </p>
                </div>
              ) : (
                <div style={tableWrapperStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Stream Key</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Penonton</th>
                        <th style={thStyle}>Durasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveStreams.map((stream) => (
                        <tr key={stream.streamKey} style={trStyle}>
                          <td style={tdStyle}>
                            <code style={codeStyle}>{stream.streamKey}</code>
                          </td>
                          <td style={tdStyle}>
                            <span style={liveBadgeStyle}>
                              <span style={liveDotStyle} />
                              LIVE
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontFamily: "'SF Mono', 'Cascadia Code', Consolas, monospace" }}>
                            {stream.viewerCount || 0}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: "'SF Mono', 'Cascadia Code', Consolas, monospace" }}>
                            {stream.startedAt ? formatDuration(stream.startedAt) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Informasi Server</h2>
              <div style={infoGridStyle}>
                <div style={infoItemStyle}>
                  <span style={infoLabelStyle}>RTMP Ingest</span>
                  <code style={infoValueStyle}>rtmp://localhost:1935/live</code>
                </div>
                <div style={infoItemStyle}>
                  <span style={infoLabelStyle}>HTTP Port</span>
                  <code style={infoValueStyle}>8080</code>
                </div>
                <div style={infoItemStyle}>
                  <span style={infoLabelStyle}>WebSocket Port</span>
                  <code style={infoValueStyle}>8081</code>
                </div>
                <div style={infoItemStyle}>
                  <span style={infoLabelStyle}>FLV Stream</span>
                  <code style={infoValueStyle}>:10080/live/{'{streamKey}'}.flv</code>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  background: "#0f0f0f",
  color: "#e4e4e7",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const sidebarStyle: React.CSSProperties = {
  width: 240,
  background: "#141414",
  borderRight: "1px solid #27272a",
  display: "flex",
  flexDirection: "column",
  padding: "20px 0",
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
};

const logoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 20px 20px",
  borderBottom: "1px solid #27272a",
  fontSize: 16,
  fontWeight: 600,
};

const logoIconStyle: React.CSSProperties = {
  color: "#22c55e",
  fontSize: 18,
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "16px 12px",
  flex: 1,
};

const navItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 6,
  color: "#a1a1aa",
  textDecoration: "none",
  fontSize: 14,
  transition: "background 0.15s, color 0.15s",
};

const navItemActiveStyle: React.CSSProperties = {
  background: "#27272a",
  color: "#e4e4e7",
};

const navIconStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
};

const sidebarFooterStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "16px 20px",
  borderTop: "1px solid #27272a",
};

const statusDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#22c55e",
};

const logoutBtnStyle: React.CSSProperties = {
  padding: "4px 10px",
  background: "transparent",
  border: "1px solid #27272a",
  borderRadius: 4,
  color: "#71717a",
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  marginLeft: 240,
  padding: 32,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 32,
};

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
  margin: 0,
  color: "#fafafa",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#71717a",
  margin: "4px 0 0",
};

const headerRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const timestampStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#52525b",
  fontFamily: "'SF Mono', 'Cascadia Code', Consolas, monospace",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 32,
};

const statCardStyle: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
  padding: "20px",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: 8,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  color: "#fafafa",
  lineHeight: 1,
};

const statSubStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#52525b",
  marginTop: 8,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#e4e4e7",
  margin: "0 0 16px",
};

const emptyStateStyle: React.CSSProperties = {
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

const tableWrapperStyle: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
  overflow: "hidden",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: 12,
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  borderBottom: "1px solid #27272a",
  fontWeight: 500,
};

const trStyle: React.CSSProperties = {
  borderBottom: "1px solid #27272a",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 14,
};

const codeStyle: React.CSSProperties = {
  background: "#27272a",
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "'SF Mono', 'Cascadia Code', Consolas, monospace",
};

const liveBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "2px 8px",
  background: "rgba(34, 197, 94, 0.15)",
  color: "#22c55e",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
};

const liveDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#22c55e",
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const infoItemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "12px 16px",
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#71717a",
};

const infoValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#e4e4e7",
  fontFamily: "'SF Mono', 'Cascadia Code', Consolas, monospace",
  background: "none",
  padding: 0,
};

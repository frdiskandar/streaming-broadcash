import { useState, useEffect, useRef } from "react";
import UserManagement from "./UserManagement";
import StreamKeyManagement from "./StreamKeyManagement";
import ViewerManagement from "./ViewerManagement";
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
  return formatUptime(Date.now() - startedAt);
}

function StreamPreview({ streamKey }: { streamKey: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"connecting" | "playing" | "error">("connecting");
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    let flvPlayer: any = null;
    let destroyed = false;

    async function init() {
      const flvjs = await import("flv.js");
      if (destroyed) return;
      if (!flvjs.default.isSupported() || !videoRef.current) return;

      const isDev = window.location.port === "3000";
      const flvUrl = isDev
        ? `/live/${streamKey}.flv`
        : `http://${window.location.hostname}:10080/live/${streamKey}.flv`;

      flvPlayer = flvjs.default.createPlayer({
        type: "flv",
        isLive: true,
        url: flvUrl,
        cors: true,
        hasAudio: true,
        hasVideo: true,
      });

      flvPlayer.attachMediaElement(videoRef.current);
      flvPlayer.load();

      flvPlayer.on(flvjs.default.Events.ERROR, () => {
        if (!destroyed) setStatus("error");
      });

      flvPlayer.on(flvjs.default.Events.STATISTICS_INFO, () => {
        if (!destroyed && status !== "playing") setStatus("playing");
      });

      try {
        await flvPlayer.play();
      } catch {
        // autoplay blocked, waiting for user interaction
      }
    }

    init();
    return () => {
      destroyed = true;
      flvPlayer?.unload();
      flvPlayer?.detachMediaElement();
    };
  }, [streamKey]);

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-zinc-400">Preview Siaran</span>
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
            {streamKey}
          </span>
        </div>
        <button
          onClick={toggleMute}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
          title={muted ? "Aktifkan suara" : "Matikan suara"}
        >
          {muted ? "\u{1F507}" : "\u{1F50A}"}
        </button>
      </div>
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="h-full w-full object-contain"
        />
        {status === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
              Menghubungkan...
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-zinc-500">Gagal memuat stream</span>
          </div>
        )}
      </div>
    </div>
  );
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

  const activeTab = pathname === "/admin/users"
    ? "users"
    : pathname === "/admin/stream-keys"
      ? "stream-keys"
      : pathname === "/admin/viewers"
        ? "viewers"
        : "dashboard";

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

  const totalViewers = streams.reduce((sum, stream) => sum + (stream.viewerCount || 0), 0);
  const liveStreams = streams.filter((stream) => stream.isLive);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed bottom-0 left-0 top-0 flex w-60 flex-col border-r border-zinc-800 bg-zinc-900/95 py-5">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 pb-5 text-base font-semibold">
          <span className="text-lg text-emerald-500">&#9654;</span>
          <span>Broadcast</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <a
            href="/admin"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${activeTab === "dashboard"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
              }`}
          >
            <span className="text-xs opacity-70">&#9632;</span>
            Dashboard
          </a>
          <a
            href="/admin/users"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${activeTab === "users"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
              }`}
          >
            <span className="text-xs opacity-70">&#9775;</span>
            Pengguna
          </a>
          <a
            href="/admin/stream-keys"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${activeTab === "stream-keys"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
              }`}
          >
            <span className="text-xs opacity-70">&#128273;</span>
            Stream Keys
          </a>
          <a
            href="/admin/viewers"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${activeTab === "viewers"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
              }`}
          >
            <span className="text-xs opacity-70">&#128101;</span>
            Viewers
          </a>
        </nav>

        <div className="flex items-center gap-3 border-t border-zinc-800 px-5 pt-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-400">Server Online</span>
            </div>
            {user && (
              <div className="truncate pl-4 text-[11px] text-zinc-500">
                {user.username} ({user.role})
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="ml-60 p-8">
        {activeTab === "users" ? (
          <UserManagement />
        ) : activeTab === "stream-keys" ? (
          <StreamKeyManagement />
        ) : activeTab === "viewers" ? (
          <ViewerManagement />
        ) : (
          <>
            <header className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h1 className="m-0 text-2xl font-semibold text-zinc-50">Dashboard</h1>
                <p className="mt-1 text-sm text-zinc-400">Monitor siaran dan server Anda</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-500">
                  Update: {lastUpdate.toLocaleTimeString("id-ID")}
                </span>
              </div>
            </header>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-2 text-xs uppercase tracking-[0.05em] text-zinc-400">Status Siaran</div>
                <div className="text-3xl font-semibold leading-none">
                  <span className={liveStreams.length > 0 ? "text-emerald-500" : "text-zinc-500"}>
                    {liveStreams.length > 0 ? "LIVE" : "OFFLINE"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-zinc-500">{liveStreams.length} stream aktif</div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-2 text-xs uppercase tracking-[0.05em] text-zinc-400">Total Penonton</div>
                <div className="text-3xl font-semibold leading-none text-zinc-50">{totalViewers}</div>
                <div className="mt-2 text-xs text-zinc-500">penonton terhubung</div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-2 text-xs uppercase tracking-[0.05em] text-zinc-400">Uptime Server</div>
                <div className="text-3xl font-semibold leading-none text-zinc-50">
                  {formatUptime(Date.now() - serverStartTime)}
                </div>
                <div className="mt-2 text-xs text-zinc-500">sejak server dimulai</div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-2 text-xs uppercase tracking-[0.05em] text-zinc-400">RTMP Port</div>
                <div className="font-mono text-3xl font-semibold leading-none text-zinc-50">1935</div>
                <div className="mt-2 text-xs text-zinc-500">OBS stream endpoint</div>
              </div>
            </div>

            {/* Stream Preview */}
            {liveStreams.length > 0 && (
              <section className="mb-8">
                <StreamPreview streamKey={liveStreams[0].streamKey} />
              </section>
            )}

            <section className="mb-8">
              <h2 className="mb-4 text-base font-semibold text-zinc-200">Siaran Aktif</h2>

              {liveStreams.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center">
                  <div className="mb-3 text-3xl opacity-30">&#9210;</div>
                  <p className="m-0 text-sm text-zinc-400">Tidak ada siaran aktif saat ini</p>
                  <p className="mt-2 text-xs text-zinc-500">Mulai siaran dari OBS ke rtmp://localhost:1935/live</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border-b border-zinc-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-zinc-400">Stream Key</th>
                        <th className="border-b border-zinc-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-zinc-400">Status</th>
                        <th className="border-b border-zinc-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-zinc-400">Penonton</th>
                        <th className="border-b border-zinc-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-zinc-400">Durasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveStreams.map((stream) => (
                        <tr key={stream.streamKey} className="border-b border-zinc-800 last:border-b-0">
                          <td className="px-4 py-3 text-sm text-zinc-200">
                            <code className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[13px] text-zinc-100">
                              {stream.streamKey}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-200">
                            <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              LIVE
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-zinc-300">{stream.viewerCount || 0}</td>
                          <td className="px-4 py-3 font-mono text-sm text-zinc-300">
                            {stream.startedAt ? formatDuration(stream.startedAt) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-base font-semibold text-zinc-200">Informasi Server</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <span className="block text-xs uppercase tracking-[0.05em] text-zinc-400">RTMP Ingest</span>
                  <code className="mt-2 block break-all rounded bg-zinc-800 px-2 py-1 font-mono text-sm text-zinc-200">rtmp://localhost:1935/live</code>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <span className="block text-xs uppercase tracking-[0.05em] text-zinc-400">HTTP Port</span>
                  <code className="mt-2 block rounded bg-zinc-800 px-2 py-1 font-mono text-sm text-zinc-200">8080</code>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <span className="block text-xs uppercase tracking-[0.05em] text-zinc-400">WebSocket Port</span>
                  <code className="mt-2 block rounded bg-zinc-800 px-2 py-1 font-mono text-sm text-zinc-200">8081</code>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <span className="block text-xs uppercase tracking-[0.05em] text-zinc-400">FLV Stream</span>
                  <code className="mt-2 block break-all rounded bg-zinc-800 px-2 py-1 font-mono text-sm text-zinc-200">:10080/live/{"{streamKey}"}.flv</code>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
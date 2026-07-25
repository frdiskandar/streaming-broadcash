import { useState, useEffect, useRef } from "react";
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
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="mb-4 text-5xl">&#8987;</div>
        <p className="text-base text-zinc-400">Memuat...</p>
      </div>
    );
  }

  // Admin routes — admin only
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!user) return <LoginPage />;
    if (user.role !== "admin") {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100">
          <div className="mb-4 text-5xl opacity-30">&#128274;</div>
          <p className="mb-2 text-base text-red-500">Akses Ditolak</p>
          <p className="text-sm text-zinc-500">Anda tidak memiliki akses ke halaman ini</p>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="mt-5 rounded-md border border-zinc-800 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
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
  const { user, logout } = useAuth();
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [checking, setChecking] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkStream();
    const interval = setInterval(checkStream, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
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
      <div className="relative h-screen w-screen bg-zinc-950 text-zinc-100">
        <div ref={profileMenuRef} className="absolute right-4 top-4 z-20">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/95 text-sm font-semibold text-zinc-200 shadow-lg shadow-black/20 transition hover:border-zinc-700 hover:bg-zinc-800"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-label="Buka profil"
          >
            {user?.username?.[0]?.toUpperCase() ?? "U"}
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-black/40">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400">
                  {user?.username?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-100">
                    {user?.username ?? "User"}
                  </div>
                  <div className="truncate text-xs text-zinc-400">
                    {user?.email ?? "-"}
                  </div>
                </div>
              </div>

              <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Role</div>
                <div className="mt-1 text-sm text-zinc-200">{user?.role ?? "viewer"}</div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setProfileOpen(false);
                  await logout();
                }}
                className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center justify-center p-12">
            <div className="mb-4 text-5xl">&#8987;</div>
            <p className="text-base text-zinc-400">Memeriksa stream...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeStream) {
    return (
      <div className="relative h-screen w-screen bg-zinc-950 text-zinc-100">
        <div ref={profileMenuRef} className="absolute right-4 top-4 z-20">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/95 text-sm font-semibold text-zinc-200 shadow-lg shadow-black/20 transition hover:border-zinc-700 hover:bg-zinc-800"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-label="Buka profil"
          >
            {user?.username?.[0]?.toUpperCase() ?? "U"}
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-black/40">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400">
                  {user?.username?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-100">
                    {user?.username ?? "User"}
                  </div>
                  <div className="truncate text-xs text-zinc-400">
                    {user?.email ?? "-"}
                  </div>
                </div>
              </div>

              <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Role</div>
                <div className="mt-1 text-sm text-zinc-200">{user?.role ?? "viewer"}</div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setProfileOpen(false);
                  await logout();
                }}
                className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 text-6xl opacity-30">&#9210;</div>
            <h2 className="mb-2 text-2xl font-semibold text-zinc-400">
              Tidak Ada Siaran
            </h2>
            <p className="max-w-md text-sm leading-6 text-zinc-400">
              Stream akan muncul secara otomatis saat broadcaster memulai siaran dari OBS ke{" "}
              <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[13px] text-zinc-300">
                rtmp://localhost:1935/live
              </code>
            </p>
            <div className="mt-6 rounded-md bg-zinc-200 px-4 py-2 text-xs text-zinc-700">
              Menunggu siaran...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-black text-zinc-100">
      <div ref={profileMenuRef} className="absolute right-4 top-4 z-20">
        <button
          type="button"
          onClick={() => setProfileOpen((open) => !open)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/95 text-sm font-semibold text-zinc-200 shadow-lg shadow-black/20 transition hover:border-zinc-700 hover:bg-zinc-800"
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          aria-label="Buka profil"
        >
          {user?.username?.[0]?.toUpperCase() ?? "U"}
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-black/40">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-400">
                {user?.username?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-100">
                  {user?.username ?? "User"}
                </div>
                <div className="truncate text-xs text-zinc-400">
                  {user?.email ?? "-"}
                </div>
              </div>
            </div>

            <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Role</div>
              <div className="mt-1 text-sm text-zinc-200">{user?.role ?? "viewer"}</div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setProfileOpen(false);
                await logout();
              }}
              className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <Player streamKey={activeStream.streamKey} />
    </div>
  );
}

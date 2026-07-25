import NodeMediaServer from "node-media-server";
import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import { createServer } from "http";
import path from "path";
import crypto from "crypto";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import type { StreamInfo, WSMessage, User, UserProfile } from "@broadcast/shared";
import { RTMP_PORT, HTTP_PORT, WS_PORT } from "@broadcast/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Crypto Helpers ---
const SESSION_SECRET = crypto.randomBytes(32).toString("hex");
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, s, 100000, 64, "sha256").toString("hex");
  return { hash, salt: s };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha256").toString("hex");
  return result === hash;
}

function createSessionToken(userId: string): string {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${userId}:${timestamp}`)
    .digest("hex");
  return `${userId}:${timestamp}:${signature}`;
}

function validateSessionToken(token: string): string | null {
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [userId, timestamp, signature] = parts;
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${userId}:${timestamp}`)
    .digest("hex");
  if (signature !== expected) return null;
  const age = Date.now() - parseInt(timestamp);
  if (age > SESSION_MAX_AGE) return null;
  return userId;
}

function parseCookies(req: express.Request): Record<string, string> {
  const cookies: Record<string, string> = {};
  const header = req.headers.cookie || "";
  for (const pair of header.split(";")) {
    const [key, ...val] = pair.split("=");
    if (key) cookies[key.trim()] = decodeURIComponent(val.join("="));
  }
  return cookies;
}

function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// --- SQLite Database ---
const DB_PATH = path.resolve(__dirname, "../data/broadcast.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    created_at INTEGER NOT NULL
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

function dbGetUser(id: string): User | undefined {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  if (!row) return undefined;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    role: row.role,
    createdAt: row.created_at,
  };
}

function dbGetUserByUsernameOrEmail(identifier: string): User | undefined {
  const row = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(identifier, identifier) as any;
  if (!row) return undefined;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    role: row.role,
    createdAt: row.created_at,
  };
}

function dbGetAllUsers(): UserProfile[] {
  const rows = db.prepare("SELECT id, username, email, role, created_at FROM users").all() as any[];
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    email: r.email,
    role: r.role,
    createdAt: r.created_at,
  }));
}

function dbCreateUser(user: User): void {
  db.prepare(
    "INSERT INTO users (id, username, email, password_hash, password_salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(user.id, user.username, user.email, user.passwordHash, user.passwordSalt, user.role, user.createdAt);
}

function dbUpdateUser(id: string, data: { username?: string; email?: string; passwordHash?: string; passwordSalt?: string; role?: string }): void {
  const sets: string[] = [];
  const vals: any[] = [];
  if (data.username !== undefined) { sets.push("username = ?"); vals.push(data.username); }
  if (data.email !== undefined) { sets.push("email = ?"); vals.push(data.email); }
  if (data.passwordHash !== undefined) { sets.push("password_hash = ?"); vals.push(data.passwordHash); }
  if (data.passwordSalt !== undefined) { sets.push("password_salt = ?"); vals.push(data.passwordSalt); }
  if (data.role !== undefined) { sets.push("role = ?"); vals.push(data.role); }
  if (sets.length === 0) return;
  vals.push(id);
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
}

function dbDeleteUser(id: string): void {
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

function dbCountUsers(): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  return row.count;
}

function initDefaultAdmin(): void {
  if (dbCountUsers() === 0) {
    const { hash, salt } = hashPassword("admin123");
    const admin: User = {
      id: crypto.randomUUID(),
      username: "admin",
      email: "admin@broadcast.local",
      passwordHash: hash,
      passwordSalt: salt,
      role: "admin",
      createdAt: Date.now(),
    };
    dbCreateUser(admin);
    console.log("[AUTH] Default admin created: admin / admin123");
  }
}

// --- Session Storage (SQLite) ---
function dbCreateSession(token: string, userId: string, expiresAt: number): void {
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
}

function dbGetSession(token: string): { userId: string; expiresAt: number } | undefined {
  const row = db.prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?").get(token) as any;
  if (!row) return undefined;
  if (row.expires_at < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return undefined;
  }
  return { userId: row.user_id, expiresAt: row.expires_at };
}

function dbDeleteSession(token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

function dbCleanupExpiredSessions(): void {
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
}

// --- State ---
const streams = new Map<string, StreamInfo>();
const viewers = new Map<string, Set<WebSocket>>();

// --- Auth Middleware ---
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const cookies = parseCookies(req);
  const token = cookies.session_token;
  if (!token) {
    res.status(401).json({ error: "Tidak terautentikasi" });
    return;
  }
  const userId = validateSessionToken(token);
  if (!userId) {
    res.status(401).json({ error: "Sesi tidak valid" });
    return;
  }
  const session = dbGetSession(token);
  if (!session || session.userId !== userId) {
    res.status(401).json({ error: "Sesi tidak ditemukan" });
    return;
  }
  const user = dbGetUser(userId);
  if (!user) {
    res.status(401).json({ error: "Pengguna tidak ditemukan" });
    return;
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const user = (req as any).user as User;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Akses ditolak" });
    return;
  }
  next();
}

// --- Node Media Server (RTMP ingest from OBS) ---
const nmConfig = {
  rtmp: {
    port: RTMP_PORT,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 10080,
    allow_origin: "*",
    mediaroot: path.resolve(__dirname, "../media"),
    trans: {
      ffmpeg: "/usr/bin/ffmpeg",
      tasks: [
        {
          app: "live",
          hls: true,
          hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
        },
      ],
    },
  },
};

const nmServer = new NodeMediaServer(nmConfig);

nmServer.on("prePublish", (id: string, streamPath: string) => {
  const parts = streamPath.split("/").filter(Boolean);
  const streamKey = parts[parts.length - 1] || "live";
  console.log(`[RTMP] Stream started: ${streamKey} (path: ${streamPath}, id: ${id})`);

  streams.set(streamKey, {
    streamKey,
    isLive: true,
    viewerCount: 0,
    startedAt: Date.now(),
  });

  broadcast({
    type: "stream_start",
    payload: { streamKey, startedAt: Date.now() },
  });
});

nmServer.on("donePublish", (id: string, streamPath: string) => {
  const streamKey = streamPath.split("/").pop() || "unknown";
  console.log(`[RTMP] Stream ended: ${streamKey} (id: ${id})`);

  const info = streams.get(streamKey);
  if (info) {
    info.isLive = false;
    streams.delete(streamKey);
  }

  const streamViewers = viewers.get(streamKey);
  if (streamViewers) {
    for (const ws of streamViewers) {
      ws.close(1000, "Stream ended");
    }
    viewers.delete(streamKey);
  }

  broadcast({
    type: "stream_end",
    payload: { streamKey },
  });
});

// --- WebSocket Server ---
const wsServer = new WebSocketServer({ port: WS_PORT });

wsServer.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", `http://localhost`);
  const streamKey = url.searchParams.get("stream") || "live";

  console.log(`[WS] Client connected to stream: ${streamKey}`);

  if (!viewers.has(streamKey)) {
    viewers.set(streamKey, new Set());
  }
  viewers.get(streamKey)!.add(ws);

  const info = streams.get(streamKey);
  if (info) {
    info.viewerCount = viewers.get(streamKey)!.size;
    broadcast({
      type: "viewer_count",
      payload: { streamKey, viewerCount: info.viewerCount },
    });
  }

  ws.on("close", () => {
    console.log(`[WS] Client disconnected from stream: ${streamKey}`);
    const streamViewers = viewers.get(streamKey);
    if (streamViewers) {
      streamViewers.delete(ws);
      if (streamViewers.size === 0) {
        viewers.delete(streamKey);
      } else if (info) {
        info.viewerCount = streamViewers.size;
        broadcast({
          type: "viewer_count",
          payload: { streamKey, viewerCount: info.viewerCount },
        });
      }
    }
  });

  ws.on("error", (err) => {
    console.error(`[WS] Error:`, err.message);
  });
});

function broadcast(msg: WSMessage) {
  const data = JSON.stringify(msg);
  for (const [, clientSet] of viewers) {
    for (const ws of clientSet) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
}

// --- HTTP Server (API + static files) ---
const app = express();
const httpServer = createServer(app);

app.use(express.json());

// --- Auth Routes ---
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username dan password harus diisi" });
    return;
  }

  const user = dbGetUserByUsernameOrEmail(username);
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const token = createSessionToken(user.id);
  const expiresAt = Date.now() + SESSION_MAX_AGE;
  dbCreateSession(token, user.id, expiresAt);

  res.setHeader("Set-Cookie", [
    `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_MAX_AGE / 1000)}`,
  ]);
  res.json({ user: toUserProfile(user) });
});

app.post("/api/auth/logout", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies.session_token;
  if (token) {
    dbDeleteSession(token);
  }
  res.setHeader("Set-Cookie", [
    "session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  ]);
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user as User;
  res.json({ user: toUserProfile(user) });
});

// --- User Management Routes (Admin Only) ---
app.get("/api/users", requireAuth, requireAdmin, (_req, res) => {
  res.json({ users: dbGetAllUsers() });
});

app.post("/api/users", requireAuth, requireAdmin, (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: "Username, email, dan password harus diisi" });
    return;
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ? OR email = ?").get(username, email);
  if (existing) {
    res.status(409).json({ error: "Username atau email sudah digunakan" });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    role: role === "admin" ? "admin" : "viewer",
    createdAt: Date.now(),
  };
  dbCreateUser(newUser);

  res.status(201).json({ user: toUserProfile(newUser) });
});

app.put("/api/users/:id", requireAuth, requireAdmin, (req, res) => {
  const user = dbGetUser(req.params.id as string);
  if (!user) {
    res.status(404).json({ error: "Pengguna tidak ditemukan" });
    return;
  }

  const { username, email, password, role } = req.body;

  if (username && username !== user.username) {
    const dup = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(username, user.id);
    if (dup) {
      res.status(409).json({ error: "Username sudah digunakan" });
      return;
    }
  }

  if (email && email !== user.email) {
    const dup = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, user.id);
    if (dup) {
      res.status(409).json({ error: "Email sudah digunakan" });
      return;
    }
  }

  const updateData: any = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (password) {
    const { hash, salt } = hashPassword(password);
    updateData.passwordHash = hash;
    updateData.passwordSalt = salt;
  }
  if (role === "admin" || role === "viewer") updateData.role = role;

  dbUpdateUser(user.id, updateData);
  const updated = dbGetUser(user.id)!;
  res.json({ user: toUserProfile(updated) });
});

app.delete("/api/users/:id", requireAuth, requireAdmin, (req, res) => {
  const currentUser = (req as any).user as User;
  const user = dbGetUser(req.params.id as string);
  if (!user) {
    res.status(404).json({ error: "Pengguna tidak ditemukan" });
    return;
  }
  if (user.id === currentUser.id) {
    res.status(400).json({ error: "Tidak bisa menghapus akun sendiri" });
    return;
  }

  dbDeleteUser(user.id);
  res.json({ ok: true });
});

// --- Protected Stream Routes ---
app.get("/api/streams", requireAuth, (_req, res) => {
  const list = Array.from(streams.values()).filter((s) => s.isLive);
  res.json({ streams: list });
});

app.get("/api/streams/:key", requireAuth, (req, res) => {
  const info = streams.get(req.params.key as string);
  if (!info || !info.isLive) {
    res.status(404).json({ error: "Stream not found" });
    return;
  }
  res.json(info);
});

// --- Admin Dashboard (admin only) ---
app.get("/admin", requireAuth, requireAdmin, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});
app.get("/admin/*", requireAuth, requireAdmin, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// Serve client build (NO auth - serves HTML shell)
const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// --- Start ---
initDefaultAdmin();
dbCleanupExpiredSessions();

httpServer.listen(HTTP_PORT, () => {
  console.log(`[HTTP] Server running on http://localhost:${HTTP_PORT}`);
});

console.log(`[RTMP] Ingest endpoint: rtmp://localhost:${RTMP_PORT}/live`);
console.log(`[WS]   WebSocket relay: ws://localhost:${WS_PORT}`);
console.log(`[HTTP] Web interface:   http://localhost:${HTTP_PORT}`);

nmServer.run();

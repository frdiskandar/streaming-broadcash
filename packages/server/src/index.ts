import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { HTTP_PORT } from "@broadcast/shared";

import db from "./db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import streamRoutes from "./routes/streams.js";
import streamKeyRoutes from "./routes/stream-keys.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";
import { startRtmp } from "./rtmp/index.js";
import "./ws/index.js";

import { cleanupExpiredSessions } from "./services/session.service.js";
import { countUsers, createUser } from "./services/user.service.js";
import { hashPassword, generateId } from "./lib/crypto.js";
import type { User } from "@broadcast/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Default admin ---
function initDefaultAdmin(): void {
  if (countUsers() === 0) {
    const { hash, salt } = hashPassword("admin123");
    const admin: User = {
      id: generateId(),
      username: "admin",
      email: "admin@broadcast.local",
      passwordHash: hash,
      passwordSalt: salt,
      role: "admin",
      createdAt: Date.now(),
    };
    createUser(admin);
    console.log("[AUTH] Default admin created: admin / admin123");
  }
}

// --- Express App ---
const app = express();
const httpServer = createServer(app);

app.use(express.json());

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/stream-keys", streamKeyRoutes);

// --- Admin Dashboard (admin only) ---
const clientDist = path.resolve(__dirname, "../../client/dist");

app.get("/admin", requireAuth, requireAdmin, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});
app.get("/admin/*", requireAuth, requireAdmin, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// --- Static files + SPA fallback ---
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// --- Start ---
initDefaultAdmin();
cleanupExpiredSessions();
startRtmp();

httpServer.listen(HTTP_PORT, "0.0.0.0", () => {
  console.log(`[HTTP] Server running on http://0.0.0.0:${HTTP_PORT}`);
});

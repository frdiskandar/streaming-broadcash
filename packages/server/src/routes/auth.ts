import { Router } from "express";
import { parseCookies } from "../lib/cookies.js";
import { createSessionToken, SESSION_MAX_AGE } from "../lib/crypto.js";
import { verifyPassword } from "../lib/crypto.js";
import { findUserByUsernameOrEmail, toUserProfile } from "../services/user.service.js";
import { createSession, deleteSession } from "../services/session.service.js";
import { requireAuth } from "../middleware/auth.js";
import type { User } from "@broadcast/shared";

const router = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username dan password harus diisi" });
    return;
  }

  const user = findUserByUsernameOrEmail(username);
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const token = createSessionToken(user.id);
  const expiresAt = Date.now() + SESSION_MAX_AGE;
  createSession(token, user.id, expiresAt);

  res.setHeader("Set-Cookie", [
    `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_MAX_AGE / 1000)}`,
  ]);
  res.json({ user: toUserProfile(user) });
});

router.post("/logout", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies.session_token;
  if (token) {
    deleteSession(token);
  }
  res.setHeader("Set-Cookie", [
    "session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  ]);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  const user = (req as any).user as User;
  res.json({ user: toUserProfile(user) });
});

export default router;

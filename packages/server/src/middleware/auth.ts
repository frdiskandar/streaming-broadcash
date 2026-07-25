import type { Request, Response, NextFunction } from "express";
import { parseCookies } from "../lib/cookies.js";
import { validateSessionToken } from "../lib/crypto.js";
import { findSession } from "../services/session.service.js";
import { findUserById } from "../services/user.service.js";
import type { User } from "@broadcast/shared";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
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

  const session = findSession(token);
  if (!session || session.userId !== userId) {
    res.status(401).json({ error: "Sesi tidak ditemukan" });
    return;
  }

  const user = findUserById(userId);
  if (!user) {
    res.status(401).json({ error: "Pengguna tidak ditemukan" });
    return;
  }

  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as User;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Akses ditolak" });
    return;
  }
  next();
}

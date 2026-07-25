import db from "../db.js";

export function createSession(token: string, userId: string, expiresAt: number): void {
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
}

export function findSession(token: string): { userId: string; expiresAt: number } | undefined {
  const row = db.prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?").get(token) as any;
  if (!row) return undefined;
  if (row.expires_at < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return undefined;
  }
  return { userId: row.user_id, expiresAt: row.expires_at };
}

export function deleteSession(token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function cleanupExpiredSessions(): void {
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
}

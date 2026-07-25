import db from "../db.js";
import type { User, UserProfile } from "@broadcast/shared";

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function rowToUser(row: any): User {
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

export function findUserById(id: string): User | undefined {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? rowToUser(row) : undefined;
}

export function findUserByUsernameOrEmail(identifier: string): User | undefined {
  const row = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(identifier, identifier);
  return row ? rowToUser(row) : undefined;
}

export function getAllUsers(): UserProfile[] {
  const rows = db.prepare("SELECT id, username, email, role, created_at FROM users").all() as any[];
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    email: r.email,
    role: r.role,
    createdAt: r.created_at,
  }));
}

export function createUser(user: User): void {
  db.prepare(
    "INSERT INTO users (id, username, email, password_hash, password_salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(user.id, user.username, user.email, user.passwordHash, user.passwordSalt, user.role, user.createdAt);
}

export function updateUser(
  id: string,
  data: { username?: string; email?: string; passwordHash?: string; passwordSalt?: string; role?: string }
): void {
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

export function deleteUser(id: string): void {
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function countUsers(): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  return row.count;
}

export function existsByUsernameOrEmail(username: string, email: string, excludeId?: string): boolean {
  if (excludeId) {
    const row = db.prepare("SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?").get(username, email, excludeId);
    return !!row;
  }
  const row = db.prepare("SELECT id FROM users WHERE username = ? OR email = ?").get(username, email);
  return !!row;
}

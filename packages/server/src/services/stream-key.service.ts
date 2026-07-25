import db from "../db.js";
import type { StreamKey, StreamKeyProfile } from "@broadcast/shared";

function rowToStreamKey(row: any): StreamKey {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    isActive: row.is_active === 1,
    lastUsedAt: row.last_used_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function toStreamKeyProfile(sk: StreamKey): StreamKeyProfile {
  return {
    id: sk.id,
    key: sk.key,
    name: sk.name,
    isActive: sk.isActive,
    lastUsedAt: sk.lastUsedAt,
    createdAt: sk.createdAt,
  };
}

export function findStreamKeyByKey(key: string): StreamKey | undefined {
  const row = db.prepare("SELECT * FROM stream_keys WHERE key = ?").get(key);
  return row ? rowToStreamKey(row) : undefined;
}

export function findStreamKeyById(id: string): StreamKey | undefined {
  const row = db.prepare("SELECT * FROM stream_keys WHERE id = ?").get(id);
  return row ? rowToStreamKey(row) : undefined;
}

export function getAllStreamKeys(): StreamKeyProfile[] {
  const rows = db.prepare("SELECT * FROM stream_keys ORDER BY created_at DESC").all() as any[];
  return rows.map((r) => toStreamKeyProfile(rowToStreamKey(r)));
}

export function createStreamKey(data: { key: string; name: string; isActive?: boolean }): StreamKey {
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    "INSERT INTO stream_keys (id, key, name, is_active, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, data.key, data.name, data.isActive !== false ? 1 : 0, now);

  return findStreamKeyById(id)!;
}

export function updateStreamKey(
  id: string,
  data: { key?: string; name?: string; isActive?: boolean }
): void {
  const sets: string[] = [];
  const vals: any[] = [];
  if (data.key !== undefined) { sets.push("key = ?"); vals.push(data.key); }
  if (data.name !== undefined) { sets.push("name = ?"); vals.push(data.name); }
  if (data.isActive !== undefined) { sets.push("is_active = ?"); vals.push(data.isActive ? 1 : 0); }
  if (sets.length === 0) return;
  vals.push(id);
  db.prepare(`UPDATE stream_keys SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
}

export function deleteStreamKey(id: string): void {
  db.prepare("DELETE FROM stream_keys WHERE id = ?").run(id);
}

export function updateLastUsedAt(key: string): void {
  db.prepare("UPDATE stream_keys SET last_used_at = ? WHERE key = ?").run(Date.now(), key);
}

export function existsByKey(key: string, excludeId?: string): boolean {
  if (excludeId) {
    const row = db.prepare("SELECT id FROM stream_keys WHERE key = ? AND id != ?").get(key, excludeId);
    return !!row;
  }
  const row = db.prepare("SELECT id FROM stream_keys WHERE key = ?").get(key);
  return !!row;
}

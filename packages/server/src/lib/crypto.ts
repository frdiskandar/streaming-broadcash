import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000; // 7 days
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha256";

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, s, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString("hex");
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString("hex");
  return result === hash;
}

export function createSessionToken(userId: string): string {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${userId}:${timestamp}`)
    .digest("hex");
  return `${userId}:${timestamp}:${signature}`;
}

export function validateSessionToken(token: string): string | null {
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

export function generateId(): string {
  return crypto.randomUUID();
}

export { SESSION_MAX_AGE };

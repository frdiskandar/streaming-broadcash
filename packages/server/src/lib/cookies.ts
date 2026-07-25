import type { Request } from "express";

export function parseCookies(req: Request): Record<string, string> {
  const cookies: Record<string, string> = {};
  const header = req.headers.cookie || "";
  for (const pair of header.split(";")) {
    const [key, ...val] = pair.split("=");
    if (key) cookies[key.trim()] = decodeURIComponent(val.join("="));
  }
  return cookies;
}

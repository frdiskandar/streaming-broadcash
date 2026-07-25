export interface StreamInfo {
  streamKey: string;
  isLive: boolean;
  viewerCount: number;
  startedAt?: number;
  title?: string;
}

export interface WSMessage {
  type: "stream_start" | "stream_end" | "viewer_count" | "stream_list";
  payload: unknown;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: "admin" | "viewer";
  createdAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: "admin" | "viewer";
  createdAt: number;
}

export const RTMP_PORT = 1935;
export const HTTP_PORT = 8080;
export const WS_PORT = 8081;

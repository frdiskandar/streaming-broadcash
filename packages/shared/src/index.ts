export interface StreamInfo {
  streamKey: string;
  isLive: boolean;
  viewerCount: number;
  startedAt?: number;
  title?: string;
}

export interface Viewer {
  id: string;
  username: string;
  streamKey: string;
  volume: number;
  isWatching: boolean;
  connectedAt: number;
  lastActiveAt: number;
}

export interface WSMessage {
  type:
    | "stream_start"
    | "stream_end"
    | "viewer_count"
    | "stream_list"
    | "viewer_list"
    | "set_volume"
    | "admin_set_volume"
    | "admin_set_all_volume"
    | "ping";
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

export interface StreamKey {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  lastUsedAt?: number;
  createdAt: number;
}

export type StreamKeyProfile = StreamKey;

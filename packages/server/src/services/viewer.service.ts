import { WebSocket } from "ws";
import type { Viewer, WSMessage } from "@broadcast/shared";

const viewers = new Map<string, Viewer>();
const wsToViewer = new Map<WebSocket, string>();
let viewerCounter = 0;

export function addViewer(ws: WebSocket, streamKey: string, username?: string): Viewer {
  viewerCounter++;
  const id = `viewer-${viewerCounter}`;
  const now = Date.now();

  const viewer: Viewer = {
    id,
    username: username || `Anonymous-${viewerCounter}`,
    streamKey,
    volume: 100,
    isWatching: true,
    connectedAt: now,
    lastActiveAt: now,
  };

  viewers.set(id, viewer);
  wsToViewer.set(ws, id);

  return viewer;
}

export function removeViewer(ws: WebSocket): void {
  const viewerId = wsToViewer.get(ws);
  if (!viewerId) return;

  const viewer = viewers.get(viewerId);
  if (viewer) {
    viewer.isWatching = false;
  }

  wsToViewer.delete(ws);
}

export function getViewerByWs(ws: WebSocket): Viewer | undefined {
  const viewerId = wsToViewer.get(ws);
  return viewerId ? viewers.get(viewerId) : undefined;
}

export function getViewerById(id: string): Viewer | undefined {
  return viewers.get(id);
}

export function getAllViewers(): Viewer[] {
  return Array.from(viewers.values());
}

export function getWatchingViewers(): Viewer[] {
  return Array.from(viewers.values()).filter((v) => v.isWatching);
}

export function updateViewerVolume(viewerId: string, volume: number): void {
  const viewer = viewers.get(viewerId);
  if (viewer) {
    viewer.volume = Math.max(0, Math.min(100, volume));
    viewer.lastActiveAt = Date.now();
  }
}

export function touchViewer(ws: WebSocket): void {
  const viewerId = wsToViewer.get(ws);
  if (viewerId) {
    const viewer = viewers.get(viewerId);
    if (viewer) {
      viewer.lastActiveAt = Date.now();
    }
  }
}

export function sendToViewer(ws: WebSocket, msg: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function sendToViewerById(viewerId: string, msg: WSMessage): void {
  const viewer = viewers.get(viewerId);
  if (!viewer) return;

  // Find the WebSocket for this viewer
  for (const [ws, id] of wsToViewer.entries()) {
    if (id === viewerId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      break;
    }
  }
}

export function broadcastViewerList(adminConnections: Set<WebSocket>): void {
  const msg: WSMessage = {
    type: "viewer_list",
    payload: { viewers: getAllViewers() },
  };
  const data = JSON.stringify(msg);

  for (const ws of adminConnections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

export function broadcastViewerListToAdmin(adminWs: WebSocket): void {
  const msg: WSMessage = {
    type: "viewer_list",
    payload: { viewers: getAllViewers() },
  };
  if (adminWs.readyState === WebSocket.OPEN) {
    adminWs.send(JSON.stringify(msg));
  }
}

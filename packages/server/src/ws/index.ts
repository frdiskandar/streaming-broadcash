import { WebSocketServer, WebSocket } from "ws";
import type { WSMessage } from "@broadcast/shared";
import { addViewer as addStreamViewer, removeViewer as removeStreamViewer, getStream, broadcast } from "../services/stream.service.js";
import {
  addViewer,
  removeViewer,
  getViewerByWs,
  updateViewerVolume,
  touchViewer,
  sendToViewer,
  broadcastViewerList,
  sendToViewerById,
  getAllViewers,
} from "../services/viewer.service.js";

const WS_PORT = Number(process.env.WS_PORT) || 8081;

const adminConnections = new Set<WebSocket>();

const wsServer = new WebSocketServer({ port: WS_PORT });

wsServer.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", "http://localhost");
  const streamKey = url.searchParams.get("stream") || "live";
  const role = url.searchParams.get("role") || "viewer";
  const username = url.searchParams.get("username") || undefined;

  // Admin connection
  if (role === "admin") {
    console.log(`[WS] Admin connected`);
    adminConnections.add(ws);

    // Send current viewer list immediately
    broadcastViewerList(adminConnections);

    ws.on("close", () => {
      console.log(`[WS] Admin disconnected`);
      adminConnections.delete(ws);
    });

    ws.on("message", (raw) => {
      try {
        const msg: WSMessage = JSON.parse(raw.toString());
        handleAdminMessage(ws, msg);
      } catch {}
    });

    ws.on("error", (err) => {
      console.error("[WS] Admin error:", err.message);
    });

    return;
  }

  // Viewer connection
  console.log(`[WS] Viewer connected to stream: ${streamKey} (username: ${username})`);

  // Add to stream viewers (for viewer count tracking)
  addStreamViewer(streamKey, ws);

  // Add to viewer service (for state tracking)
  const viewer = addViewer(ws, streamKey, username);

  const info = getStream(streamKey);
  if (info) {
    broadcast({ type: "viewer_count", payload: { streamKey, viewerCount: info.viewerCount } });
  }

  // Broadcast updated viewer list to admin
  broadcastViewerList(adminConnections);

  ws.on("message", (raw) => {
    try {
      const msg: WSMessage = JSON.parse(raw.toString());
      handleViewerMessage(ws, msg);
    } catch {}
  });

  ws.on("close", () => {
    console.log(`[WS] Viewer disconnected from stream: ${streamKey}`);
    removeStreamViewer(streamKey, ws);
    removeViewer(ws);

    const info = getStream(streamKey);
    if (info) {
      broadcast({ type: "viewer_count", payload: { streamKey, viewerCount: info.viewerCount } });
    }

    broadcastViewerList(adminConnections);
  });

  ws.on("error", (err) => {
    console.error("[WS] Viewer error:", err.message);
  });
});

function handleViewerMessage(ws: WebSocket, msg: WSMessage): void {
  const viewer = getViewerByWs(ws);
  if (!viewer) return;

  switch (msg.type) {
    case "set_volume": {
      const { volume } = msg.payload as { volume: number };
      updateViewerVolume(viewer.id, volume);
      touchViewer(ws);
      broadcastViewerList(adminConnections);
      break;
    }
    case "ping": {
      touchViewer(ws);
      sendToViewer(ws, { type: "ping", payload: {} });
      break;
    }
  }
}

function handleAdminMessage(adminWs: WebSocket, msg: WSMessage): void {
  switch (msg.type) {
    case "admin_set_volume": {
      const { viewerId, volume } = msg.payload as { viewerId: string; volume: number };
      updateViewerVolume(viewerId, volume);
      sendToViewerById(viewerId, {
        type: "admin_set_volume",
        payload: { volume },
      });
      broadcastViewerList(adminConnections);
      break;
    }
    case "admin_set_all_volume": {
      const { volume } = msg.payload as { volume: number };
      const viewers = getAllViewers();
      for (const v of viewers) {
        if (v.isWatching) {
          updateViewerVolume(v.id, volume);
          sendToViewerById(v.id, {
            type: "admin_set_volume",
            payload: { volume },
          });
        }
      }
      broadcastViewerList(adminConnections);
      break;
    }
  }
}

console.log(`[WS] WebSocket relay: ws://localhost:${WS_PORT}`);

import { WebSocketServer, WebSocket } from "ws";
import { WS_PORT } from "@broadcast/shared";
import { addViewer, removeViewer, getStream, broadcast } from "../services/stream.service.js";

const wsServer = new WebSocketServer({ port: WS_PORT });

wsServer.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", "http://localhost");
  const streamKey = url.searchParams.get("stream") || "live";

  console.log(`[WS] Client connected to stream: ${streamKey}`);

  addViewer(streamKey, ws);

  const info = getStream(streamKey);
  if (info) {
    broadcast({ type: "viewer_count", payload: { streamKey, viewerCount: info.viewerCount } });
  }

  ws.on("close", () => {
    console.log(`[WS] Client disconnected from stream: ${streamKey}`);
    removeViewer(streamKey, ws);
  });

  ws.on("error", (err) => {
    console.error("[WS] Error:", err.message);
  });
});

console.log(`[WS] WebSocket relay: ws://localhost:${WS_PORT}`);

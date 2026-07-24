import NodeMediaServer from "node-media-server";
import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import type { StreamInfo, WSMessage } from "@broadcast/shared";
import { RTMP_PORT, HTTP_PORT, WS_PORT } from "@broadcast/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- State ---
const streams = new Map<string, StreamInfo>();
const viewers = new Map<string, Set<WebSocket>>();

// --- Node Media Server (RTMP ingest from OBS) ---
const nmConfig = {
  rtmp: {
    port: RTMP_PORT,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 10080,
    allow_origin: "*",
    mediaroot: path.resolve(__dirname, "../media"),
    trans: {
      ffmpeg: "/usr/bin/ffmpeg",
      tasks: [
        {
          app: "live",
          hls: true,
          hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
        },
      ],
    },
  },
};

const nmServer = new NodeMediaServer(nmConfig);

nmServer.on("prePublish", (id: string, streamPath: string) => {
  const streamKey = streamPath.split("/").pop() || "unknown";
  console.log(`[RTMP] Stream started: ${streamKey} (id: ${id})`);

  streams.set(streamKey, {
    streamKey,
    isLive: true,
    viewerCount: 0,
    startedAt: Date.now(),
  });

  broadcast({
    type: "stream_start",
    payload: { streamKey, startedAt: Date.now() },
  });
});

nmServer.on("donePublish", (id: string, streamPath: string) => {
  const streamKey = streamPath.split("/").pop() || "unknown";
  console.log(`[RTMP] Stream ended: ${streamKey} (id: ${id})`);

  const info = streams.get(streamKey);
  if (info) {
    info.isLive = false;
    streams.delete(streamKey);
  }

  // Close all viewer connections for this stream
  const streamViewers = viewers.get(streamKey);
  if (streamViewers) {
    for (const ws of streamViewers) {
      ws.close(1000, "Stream ended");
    }
    viewers.delete(streamKey);
  }

  broadcast({
    type: "stream_end",
    payload: { streamKey },
  });
});

// --- WebSocket Server (FLV relay to clients) ---
const wsServer = new WebSocketServer({ port: WS_PORT });

wsServer.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", `http://localhost`);
  const streamKey = url.searchParams.get("stream") || "live";

  console.log(`[WS] Client connected to stream: ${streamKey}`);

  // Add viewer
  if (!viewers.has(streamKey)) {
    viewers.set(streamKey, new Set());
  }
  viewers.get(streamKey)!.add(ws);

  // Update viewer count
  const info = streams.get(streamKey);
  if (info) {
    info.viewerCount = viewers.get(streamKey)!.size;
    broadcast({
      type: "viewer_count",
      payload: { streamKey, viewerCount: info.viewerCount },
    });
  }

  ws.on("close", () => {
    console.log(`[WS] Client disconnected from stream: ${streamKey}`);
    const streamViewers = viewers.get(streamKey);
    if (streamViewers) {
      streamViewers.delete(ws);
      if (streamViewers.size === 0) {
        viewers.delete(streamKey);
      } else if (info) {
        info.viewerCount = streamViewers.size;
        broadcast({
          type: "viewer_count",
          payload: { streamKey, viewerCount: info.viewerCount },
        });
      }
    }
  });

  ws.on("error", (err) => {
    console.error(`[WS] Error:`, err.message);
  });
});

function broadcast(msg: WSMessage) {
  const data = JSON.stringify(msg);
  for (const [, clientSet] of viewers) {
    for (const ws of clientSet) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
}

// --- HTTP Server (API + static files) ---
const app = express();
const httpServer = createServer(app);

app.use(express.json());

app.get("/api/streams", (_req, res) => {
  const list = Array.from(streams.values()).filter((s) => s.isLive);
  res.json({ streams: list });
});

app.get("/api/streams/:key", (req, res) => {
  const info = streams.get(req.params.key);
  if (!info || !info.isLive) {
    return res.status(404).json({ error: "Stream not found" });
  }
  res.json(info);
});

// Serve client build
const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// --- Start ---
httpServer.listen(HTTP_PORT, () => {
  console.log(`[HTTP] Server running on http://localhost:${HTTP_PORT}`);
});

console.log(`[RTMP] Ingest endpoint: rtmp://localhost:${RTMP_PORT}/live`);
console.log(`[WS]   WebSocket relay: ws://localhost:${WS_PORT}`);
console.log(`[HTTP] Web interface:   http://localhost:${HTTP_PORT}`);

nmServer.run();

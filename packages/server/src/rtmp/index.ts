import path from "path";
import { fileURLToPath } from "url";
import NodeMediaServer from "node-media-server";
import { setStreamLive, setStreamEnded, broadcast } from "../services/stream.service.js";
import { findStreamKeyByKey, updateLastUsedAt } from "../services/stream-key.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RTMP_PORT = Number(process.env.RTMP_PORT) || 1935;
const HTTP_FLV_PORT = Number(process.env.HTTP_FLV_PORT) || 10080;
const FFMPEG_PATH = process.env.FFMPEG_PATH || "/usr/bin/ffmpeg";
const MEDIA_ROOT = process.env.MEDIA_ROOT || path.resolve(__dirname, "../../media");

const config = {
  rtmp: {
    port: RTMP_PORT,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: HTTP_FLV_PORT,
    allow_origin: "*",
    mediaroot: MEDIA_ROOT,
    trans: {
      ffmpeg: FFMPEG_PATH,
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

const nmServer = new NodeMediaServer(config);

nmServer.on("prePublish", (id: string, streamPath: string) => {
  const parts = streamPath.split("/").filter(Boolean);
  const streamKey = parts[parts.length - 1] || "live";

  // Validate stream key against database
  const keyData = findStreamKeyByKey(streamKey);
  if (!keyData) {
    console.log(`[RTMP] Rejected: invalid stream key "${streamKey}" (id: ${id})`);
    throw new Error("Invalid stream key");
  }

  if (!keyData.isActive) {
    console.log(`[RTMP] Rejected: stream key "${streamKey}" is disabled (id: ${id})`);
    throw new Error("Stream key disabled");
  }

  // Update last used timestamp
  updateLastUsedAt(streamKey);

  console.log(`[RTMP] Stream started: ${streamKey} (name: ${keyData.name}, id: ${id})`);

  setStreamLive(streamKey);
  broadcast({ type: "stream_start", payload: { streamKey, startedAt: Date.now() } });
});

nmServer.on("donePublish", (id: string, streamPath: string) => {
  const streamKey = streamPath.split("/").pop() || "unknown";
  console.log(`[RTMP] Stream ended: ${streamKey} (id: ${id})`);

  setStreamEnded(streamKey);
  broadcast({ type: "stream_end", payload: { streamKey } });
});

export function startRtmp(): void {
  nmServer.run();
  console.log(`[RTMP] Ingest endpoint: rtmp://localhost:${RTMP_PORT}/live`);
}

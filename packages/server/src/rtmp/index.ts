import path from "path";
import { fileURLToPath } from "url";
import NodeMediaServer from "node-media-server";
import { RTMP_PORT } from "@broadcast/shared";
import { setStreamLive, setStreamEnded, broadcast } from "../services/stream.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
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
    mediaroot: path.resolve(__dirname, "../../media"),
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

const nmServer = new NodeMediaServer(config);

nmServer.on("prePublish", (id: string, streamPath: string) => {
  const parts = streamPath.split("/").filter(Boolean);
  const streamKey = parts[parts.length - 1] || "live";
  console.log(`[RTMP] Stream started: ${streamKey} (path: ${streamPath}, id: ${id})`);

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

import { useEffect, useRef, useState } from "react";

interface PlayerProps {
  streamKey: string;
  wsHost: string;
}

export default function Player({ streamKey, wsHost }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"connecting" | "playing" | "disconnected">("connecting");
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    let flvPlayer: any = null;
    let ws: WebSocket | null = null;

    async function init() {
      const flvjs = await import("flv.js");

      if (!flvjs.default.isSupported()) {
        setStatus("disconnected");
        return;
      }

      // WebSocket for signaling and metadata
      ws = new WebSocket(`${wsHost}?stream=${streamKey}`);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "viewer_count" && msg.payload.streamKey === streamKey) {
          setViewerCount(msg.payload.viewerCount);
        }
        if (msg.type === "stream_end" && msg.payload.streamKey === streamKey) {
          setStatus("disconnected");
          flvPlayer?.unload();
        }
      };

      // FLV player via WebSocket transport
      flvPlayer = flvjs.default.createPlayer({
        type: "flv",
        isLive: true,
        url: `ws://${wsHost.replace("ws://", "")}?stream=${streamKey}`,
      });

      flvPlayer.attachMediaElement(videoRef.current!);
      flvPlayer.load();
      flvPlayer.play();

      flvPlayer.on(flvjs.default.Events.ERROR, () => {
        setStatus("disconnected");
      });

      flvPlayer.on(flvjs.default.Events.STATISTICS_INFO, () => {
        setStatus("playing");
      });
    }

    init();

    return () => {
      flvPlayer?.unload();
      flvPlayer?.detachMediaElement();
      ws?.close();
    };
  }, [streamKey, wsHost]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontSize: 18 }}>{streamKey}</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              background: status === "playing" ? "#c6f6d5" : status === "connecting" ? "#fefcbf" : "#fed7d7",
              color: status === "playing" ? "#22543d" : status === "connecting" ? "#744210" : "#742a2a",
            }}
          >
            {status.toUpperCase()}
          </span>
          <span style={{ fontSize: 14, color: "#666" }}>{viewerCount} watching</span>
        </div>
      </div>
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        style={{
          width: "100%",
          maxHeight: 540,
          background: "#000",
          borderRadius: 8,
        }}
      />
    </div>
  );
}

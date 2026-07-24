import { useEffect, useRef, useState } from "react";

interface PlayerProps {
  streamKey: string;
}

export default function Player({ streamKey }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"connecting" | "playing" | "disconnected">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    let flvPlayer: any = null;
    let ws: WebSocket | null = null;
    let destroyed = false;

    async function init() {
      const flvjs = await import("flv.js");
      if (destroyed) return;

      if (!flvjs.default.isSupported()) {
        setStatus("disconnected");
        setError("Browser tidak mendukung MSE (Media Source Extensions)");
        return;
      }

      const wsHost = `ws://${window.location.hostname}:8081`;
      ws = new WebSocket(`${wsHost}?stream=${streamKey}`);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "viewer_count" && msg.payload.streamKey === streamKey) {
          setViewerCount(msg.payload.viewerCount);
        }
        if (msg.type === "stream_end" && msg.payload.streamKey === streamKey) {
          setStatus("disconnected");
          setError("Siaran telah berakhir");
          flvPlayer?.unload();
        }
      };

      ws.onerror = () => {};

      const isDev = window.location.port === "3000";
      const flvUrl = isDev
        ? `/live/${streamKey}.flv`
        : `http://${window.location.hostname}:10080/live/${streamKey}.flv`;

      flvPlayer = flvjs.default.createPlayer({
        type: "flv",
        isLive: true,
        url: flvUrl,
        cors: true,
        hasAudio: true,
        hasVideo: true,
      });

      flvPlayer.attachMediaElement(videoRef.current!);
      flvPlayer.load();

      flvPlayer.on(flvjs.default.Events.ERROR, (errorType: string, errorDetail: string) => {
        if (destroyed) return;
        setError(`${errorType}: ${errorDetail}`);
        setStatus("disconnected");
      });

      flvPlayer.on(flvjs.default.Events.STATISTICS_INFO, () => {
        if (!destroyed && status !== "playing") {
          setStatus("playing");
          setError(null);
        }
      });

      try {
        await flvPlayer.play();
      } catch {
        setStatus("connecting");
      }
    }

    init();

    return () => {
      destroyed = true;
      flvPlayer?.unload();
      flvPlayer?.detachMediaElement();
      ws?.close();
    };
  }, [streamKey]);

  function handleManualPlay() {
    videoRef.current
      ?.play()
      .then(() => {
        setStatus("playing");
        setError(null);
      })
      .catch(() => {});
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#000" }}>
      {error && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            padding: "10px 16px",
            background: "rgba(220, 38, 38, 0.9)",
            borderRadius: 8,
            color: "white",
            fontSize: 14,
            zIndex: 10,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          background: "#000",
        }}
      />

      {/* Status indicator */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          background: "rgba(0,0,0,0.6)",
          borderRadius: 6,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: status === "playing" ? "#ef4444" : status === "connecting" ? "#eab308" : "#6b7280",
            animation: status === "playing" ? "pulse 2s infinite" : "none",
          }}
        />
        <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>
          {status === "playing" ? "LIVE" : status === "connecting" ? "MENGHUBUNGKAN" : "TERPUTUS"}
        </span>
        {status === "playing" && viewerCount > 0 && (
          <span style={{ color: "#aaa", fontSize: 12, marginLeft: 4 }}>
            {viewerCount} menonton
          </span>
        )}
      </div>

      {/* Play button overlay when connecting */}
      {status === "connecting" && (
        <button
          onClick={handleManualPlay}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            color: "white",
            fontSize: 28,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            zIndex: 10,
          }}
        >
          &#9654;
        </button>
      )}
    </div>
  );
}

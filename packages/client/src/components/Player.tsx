import { useEffect, useRef, useState } from "react";

interface PlayerProps {
  streamKey: string;
}

export default function Player({ streamKey }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"connecting" | "playing" | "disconnected">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(100);
  const [showVolume, setShowVolume] = useState(false);

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

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!videoRef.current) return;
    const val = Number(e.target.value);
    videoRef.current.volume = val / 100;
    setVolume(val);
    if (val > 0 && muted) {
      videoRef.current.muted = false;
      setMuted(false);
    }
    if (val === 0) {
      videoRef.current.muted = true;
      setMuted(true);
    }
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#000" }}>
      <style>{`
        .vol-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          margin-left: -5px;
        }
        .vol-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
        }
        .vol-slider::-webkit-slider-runnable-track {
          width: 4px;
          border-radius: 2px;
        }
        .vol-slider::-moz-range-track {
          width: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.3);
        }
        .vol-wrap:hover .vol-slider-box {
          opacity: 1;
          height: 100px;
          margin-bottom: 8px;
          pointer-events: auto;
        }
        .vol-slider-box {
          opacity: 0;
          height: 0;
          margin-bottom: 0;
          overflow: hidden;
          pointer-events: none;
          transition: opacity 0.2s, height 0.2s, margin-bottom 0.2s;
        }
      `}</style>

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

      {/* Muted notification */}
      {status === "playing" && muted && (
        <div
          onClick={toggleMute}
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 16px",
            background: "rgba(0,0,0,0.7)",
            borderRadius: 6,
            color: "#ccc",
            fontSize: 12,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          <span style={{ fontSize: 14 }}>&#128263;</span>
          <span>Suara dimatikan</span>
          <span style={{ color: "#888", fontSize: 11 }}>(click untuk unmute)</span>
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

      {/* Volume control */}
      {status === "playing" && (
        <div
          className="vol-wrap"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px",
            background: "rgba(0,0,0,0.6)",
            borderRadius: 8,
            zIndex: 10,
          }}
        >
          <div className="vol-slider-box" style={{ display: "flex", justifyContent: "center" }}>
            <input
              type="range"
              className="vol-slider"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                writingMode: "vertical-lr",
                direction: "rtl",
                width: 4,
                height: 80,
                appearance: "none",
                WebkitAppearance: "none",
                background: "rgba(255,255,255,0.3)",
                borderRadius: 2,
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>
          <button
            onClick={toggleMute}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: 16,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            title={muted ? "Aktifkan suara" : "Matikan suara"}
          >
            {muted || volume === 0 ? "\u{1F507}" : volume < 50 ? "\u{1F509}" : "\u{1F50A}"}
          </button>
        </div>
      )}

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

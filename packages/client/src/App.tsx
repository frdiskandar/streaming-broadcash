import { useState, useEffect } from "react";
import Player from "./components/Player";

interface Stream {
  streamKey: string;
  isLive: boolean;
  viewerCount: number;
  startedAt: number;
}

const WS_HOST = `ws://${window.location.hostname}:8081`;

export default function App() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStreams() {
    try {
      const res = await fetch("/api/streams");
      const data = await res.json();
      setStreams(data.streams);
    } catch {
      console.error("Failed to fetch streams");
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Stream Broadcast</h1>

      {selectedStream ? (
        <div>
          <button onClick={() => setSelectedStream(null)} style={{ marginBottom: 12 }}>
            Back to stream list
          </button>
          <Player streamKey={selectedStream} wsHost={WS_HOST} />
        </div>
      ) : streams.length === 0 ? (
        <p style={{ color: "#666" }}>
          No live streams. Start streaming from OBS to{" "}
          <code>rtmp://localhost:1935/live</code> with stream key.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {streams.map((s) => (
            <li
              key={s.streamKey}
              onClick={() => setSelectedStream(s.streamKey)}
              style={{
                padding: 16,
                marginBottom: 8,
                border: "1px solid #ddd",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{s.streamKey}</strong>
                <span style={{ marginLeft: 12, color: "#e53e3e", fontWeight: 600 }}>LIVE</span>
              </div>
              <span style={{ color: "#666" }}>{s.viewerCount} viewers</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

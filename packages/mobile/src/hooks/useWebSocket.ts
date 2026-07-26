import { useEffect, useRef, useState, useCallback } from "react";
import { WS_PORT } from "../config";

interface UseWebSocketOptions {
  serverHost: string;
  streamKey: string;
  username?: string;
}

interface UseWebSocketReturn {
  viewerCount: number;
  isConnected: boolean;
  streamLive: boolean;
  adminVolume: number | null;
  sendVolume: (volume: number) => void;
}

export function useWebSocket({
  serverHost,
  streamKey,
  username,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [streamLive, setStreamLive] = useState(true);
  const [adminVolume, setAdminVolume] = useState<number | null>(null);

  useEffect(() => {
    if (!serverHost || !streamKey) return;

    const params = new URLSearchParams({ stream: streamKey });
    if (username) params.set("username", username);

    const ws = new WebSocket(
      `ws://${serverHost}:${WS_PORT}?${params.toString()}`
    );
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (
          msg.type === "viewer_count" &&
          msg.payload.streamKey === streamKey
        ) {
          setViewerCount(msg.payload.viewerCount);
        }
        if (
          msg.type === "stream_end" &&
          msg.payload.streamKey === streamKey
        ) {
          setStreamLive(false);
        }
        if (msg.type === "admin_set_volume") {
          setAdminVolume(msg.payload.volume);
        }
      } catch {}
    };

    ws.onerror = () => {};
    ws.onclose = () => {
      setIsConnected(false);
      setViewerCount(0);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [serverHost, streamKey, username]);

  const sendVolume = useCallback((volume: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "set_volume", payload: { volume } })
      );
    }
  }, []);

  return { viewerCount, isConnected, streamLive, adminVolume, sendVolume };
}

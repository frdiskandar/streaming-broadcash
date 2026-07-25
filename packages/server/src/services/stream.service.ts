import type { StreamInfo, WSMessage } from "@broadcast/shared";
import { WebSocket } from "ws";

const streams = new Map<string, StreamInfo>();
const viewers = new Map<string, Set<WebSocket>>();

export function getLiveStreams(): StreamInfo[] {
  return Array.from(streams.values()).filter((s) => s.isLive);
}

export function getStream(key: string): StreamInfo | undefined {
  return streams.get(key);
}

export function setStreamLive(streamKey: string): void {
  streams.set(streamKey, {
    streamKey,
    isLive: true,
    viewerCount: 0,
    startedAt: Date.now(),
  });
}

export function setStreamEnded(streamKey: string): void {
  const info = streams.get(streamKey);
  if (info) {
    info.isLive = false;
    streams.delete(streamKey);
  }

  const streamViewers = viewers.get(streamKey);
  if (streamViewers) {
    for (const ws of streamViewers) {
      ws.close(1000, "Stream ended");
    }
    viewers.delete(streamKey);
  }
}

export function addViewer(streamKey: string, ws: WebSocket): void {
  if (!viewers.has(streamKey)) {
    viewers.set(streamKey, new Set());
  }
  viewers.get(streamKey)!.add(ws);
}

export function removeViewer(streamKey: string, ws: WebSocket): number {
  const streamViewers = viewers.get(streamKey);
  if (!streamViewers) return 0;

  streamViewers.delete(ws);
  if (streamViewers.size === 0) {
    viewers.delete(streamKey);
    return 0;
  }

  const info = streams.get(streamKey);
  if (info) {
    info.viewerCount = streamViewers.size;
  }
  return streamViewers.size;
}

export function broadcast(msg: WSMessage): void {
  const data = JSON.stringify(msg);
  for (const [, clientSet] of viewers) {
    for (const ws of clientSet) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
}

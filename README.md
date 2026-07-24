# Stream Broadcast

1-to-many live streaming monorepo. Server ingests RTMP from OBS and relays to clients via WebSocket FLV.

## Architecture

```
OBS (RTMP) --> [Server: node-media-server] --> [WebSocket FLV] --> [Client: React + flv.js]
```

## Quick Start

```bash
pnpm install

# Start everything
pnpm dev

# Or start individually
pnpm dev:server   # RTMP ingest + API on :8080
pnpm dev:client   # Vite dev server on :3000
```

## OBS Setup

1. Open OBS Settings > Stream
2. Service: Custom
3. Server: `rtmp://localhost:1935/live`
4. Stream Key: `my-stream` (or any name)
5. Start streaming

Then open `http://localhost:3000` to watch.

## Packages

| Package | Description |
|---------|-------------|
| `@broadcast/shared` | Shared types and constants |
| `@broadcast/server` | RTMP ingest, WebSocket relay, HTTP API |
| `@broadcast/client` | React viewer app with flv.js |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 1935 | RTMP | OBS stream ingest |
| 8080 | HTTP | API + static files |
| 8081 | WebSocket | FLV stream relay |
| 3000 | HTTP | Vite dev server (client only) |

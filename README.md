# Stream Broadcast

1-to-many live streaming monorepo. Server ingests RTMP from OBS and relays to viewers via WebSocket FLV (web) and HLS (mobile). Includes full admin dashboard with user management, stream key management, and real-time viewer monitoring with remote volume control.

## Architecture

```
OBS (RTMP) --> [Server: node-media-server] --> [HTTP-FLV :10080] --> [Client: React + flv.js]
                        [WebSocket :8081]  <---------> [Viewer state, admin commands]
                        [HTTP API :8080]   <---------> [Client: auth, CRUD operations]
                        [HLS (ffmpeg)]     --> [Mobile: React Native + react-native-video]
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env

# Start server + client together
pnpm dev

# Or start individually
pnpm dev:server     # RTMP ingest + API on :8080
pnpm dev:client     # Vite dev server on :3000
pnpm dev:mobile     # Expo dev server
```

## OBS Setup

1. Open OBS Settings > Stream
2. Service: Custom
3. Server: `rtmp://localhost:1935/live`
4. Stream Key: `live` (or any active stream key from admin panel)
5. Start streaming

Then open `http://localhost:3000` to watch.

## Default Login

- **Username:** `admin`
- **Password:** `admin123`

Change this immediately in production.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HTTP_PORT` | `8080` | REST API port |
| `WS_PORT` | `8081` | WebSocket port |
| `RTMP_PORT` | `1935` | RTMP ingest port |
| `HTTP_FLV_PORT` | `10080` | HTTP-FLV stream delivery port |
| `SESSION_SECRET` | *(required)* | HMAC signing key. Generate with `openssl rand -hex 32` |
| `SESSION_MAX_AGE` | `604800000` | Session TTL in ms (default: 7 days) |
| `DB_PATH` | `packages/server/data/broadcast.db` | SQLite database path |
| `FFMPEG_PATH` | `/usr/bin/ffmpeg` | Path to ffmpeg binary |
| `MEDIA_ROOT` | `packages/server/media` | HLS segment storage |
| `DEFAULT_ADMIN_USERNAME` | `admin` | Initial admin username |
| `DEFAULT_ADMIN_PASSWORD` | `admin123` | Initial admin password |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

## Packages

| Package | Description |
|---------|-------------|
| `@broadcast/shared` | Shared TypeScript types and constants |
| `@broadcast/server` | RTMP ingest, WebSocket relay, REST API, SQLite database |
| `@broadcast/client` | React web app with flv.js player and admin dashboard |
| `@broadcast/mobile` | React Native mobile viewer with HLS playback |

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 1935 | RTMP | OBS stream ingest |
| 8080 | HTTP | REST API + static file serving |
| 8081 | WebSocket | Real-time viewer state and admin commands |
| 10080 | HTTP | HTTP-FLV / HLS stream delivery |
| 3000 | HTTP | Vite dev server (client dev only) |

## Features

### Server

- **RTMP Ingest** via `node-media-server` with stream key validation against SQLite
- **HTTP-FLV** relay with `gop_cache` for fast playback startup
- **HLS transcoding** via ffmpeg (2s segments, 3-segment playlist)
- **WebSocket** for real-time viewer tracking and admin commands
- **REST API** with cookie-based authentication and role-based access control
- **SQLite** database (WAL mode) for users, sessions, and stream keys
- **PBKDF2** password hashing (100k iterations, SHA-256)
- **HMAC-signed** session tokens with configurable expiry

### Client (Web)

- **FLV player** via `flv.js` + Media Source Extensions
- **WebSocket viewer integration** for live viewer count and remote volume control
- **Admin dashboard** with stat cards, live stream preview, and uptime display
- **User management** -- full CRUD with role assignment (admin/viewer)
- **Stream key management** -- CRUD with random key generation and active/inactive toggle
- **Viewer management** -- real-time viewer grid with per-viewer and global volume control
- **Dark theme** with Tailwind CSS v4
- **Indonesian UI** labels and error messages

### Mobile

- **HLS playback** via `react-native-video`
- **WebSocket integration** for viewer count and remote volume control
- **Manual server connection** -- enter server IP and stream key
- **Volume control** with 5-dot slider
- **Expo** framework for iOS/Android builds

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (ES2022) |
| Package Manager | pnpm workspaces |
| RTMP Server | node-media-server |
| HTTP Framework | Express |
| WebSocket | ws |
| Database | better-sqlite3 (SQLite, WAL mode) |
| Web Client | React 18, Vite, Tailwind CSS v4, flv.js |
| Mobile Client | Expo SDK 52, React Native 0.76, react-native-video |
| Auth | PBKDF2 passwords, HMAC-SHA256 session tokens, HttpOnly cookies |

## Production Build

```bash
pnpm build
```

This builds shared types first, then server and client. The server serves the client's built files as static assets with SPA fallback.

## Docker Deployment

```bash
# Build and run
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop
docker compose down
```

Resource limits: 1 CPU core, 1GB RAM. Data is persisted via volumes (`./data`, `./media`).

## License

Private project.

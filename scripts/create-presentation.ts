import pptxgen from "pptxgenjs";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches (16:9)
pres.author = "Stream Broadcast Team";
pres.title = "Stream Broadcast - Presentasi Proyek";

// === PALETTE ===
const C = {
  dark: "1F1F1F",
  darkAlt: "2A2A2A",
  primary: "0D9488",
  primaryLight: "14B8A6",
  secondary: "5EEAD4",
  accent: "F3B23E",
  white: "FFFFFF",
  light: "F7F5F0",
  lightAlt: "E8F5F3",
  gray: "6B7280",
  grayLight: "E5E7EB",
  grayDark: "374151",
};

// === HELPERS ===
function addBg(slide: pptxgen.Slide, color: string) {
  slide.background = { color };
}

function addDarkBg(slide: pptxgen.Slide) {
  addBg(slide, C.dark);
}

function addLightBg(slide: pptxgen.Slide) {
  addBg(slide, C.light);
}

function addFooter(slide: pptxgen.Slide, text: string) {
  slide.addText(text, {
    x: 0.5, y: 7.0, w: 12.3, h: 0.35,
    fontSize: 9, color: C.gray, fontFace: "Segoe UI",
  });
}

function addTitle(slide: pptxgen.Slide, title: string, opts?: { color?: string; y?: number }) {
  slide.addText(title, {
    x: 0.8, y: opts?.y ?? 0.4, w: 11.7, h: 0.8,
    fontSize: 32, bold: true, fontFace: "Segoe UI Semibold",
    color: opts?.color ?? C.dark,
  });
}

function addSubtitle(slide: pptxgen.Slide, text: string, opts?: { color?: string; y?: number }) {
  slide.addText(text, {
    x: 0.8, y: opts?.y ?? 1.15, w: 11.7, h: 0.5,
    fontSize: 16, fontFace: "Segoe UI", color: opts?.color ?? C.gray,
  });
}

function addAccentBar(slide: pptxgen.Slide, x: number, y: number, h: number, color?: string) {
  slide.addShape(pres.ShapeType.rect, {
    x, y, w: 0.06, h,
    fill: { color: color || C.primary },
  });
}

function addCard(slide: pptxgen.Slide, x: number, y: number, w: number, h: number, opts?: { fill?: string; shadow?: boolean }) {
  slide.addShape(pres.ShapeType.rect, {
    x, y, w, h,
    fill: { color: opts?.fill || C.white },
    shadow: opts?.shadow !== false ? { type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.08 } : undefined,
    line: { type: "none" },
  });
}

function addStatCard(slide: pptxgen.Slide, x: number, y: number, w: number, h: number, value: string, label: string, color?: string) {
  addCard(slide, x, y, w, h);
  // Accent bar on left
  addAccentBar(slide, x, y, h, color || C.primary);
  // Value
  slide.addText(value, {
    x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.7,
    fontSize: 36, bold: true, fontFace: "Segoe UI Semibold",
    color: color || C.primary, margin: 0,
  });
  // Label
  slide.addText(label, {
    x: x + 0.2, y: y + 0.85, w: w - 0.4, h: 0.5,
    fontSize: 12, fontFace: "Segoe UI", color: C.gray, margin: 0,
  });
}

function addIconCircle(slide: pptxgen.Slide, x: number, y: number, size: number, color: string, icon: string) {
  slide.addShape(pres.ShapeType.ellipse, {
    x, y, w: size, h: size,
    fill: { color },
  });
  slide.addText(icon, {
    x, y, w: size, h: size,
    fontSize: size * 36, color: C.white, align: "center", valign: "middle",
    fontFace: "Segoe UI", margin: 0,
  });
}

// ============================================================
// SLIDE 1: TITLE
// ============================================================
const s1 = pres.addSlide();
addDarkBg(s1);

// Large accent circle (decorative)
s1.addShape(pres.ShapeType.ellipse, {
  x: -2, y: -2, w: 6, h: 6,
  fill: { color: C.primary, transparency: 85 },
});
s1.addShape(pres.ShapeType.ellipse, {
  x: 10, y: 4, w: 5, h: 5,
  fill: { color: C.secondary, transparency: 90 },
});

// Title
s1.addText("Stream Broadcast", {
  x: 0.8, y: 2.0, w: 11.7, h: 1.5,
  fontSize: 52, bold: true, fontFace: "Segoe UI Semibold",
  color: C.white,
});

// Accent line
s1.addShape(pres.ShapeType.rect, {
  x: 0.8, y: 3.5, w: 2.5, h: 0.06,
  fill: { color: C.primary },
});

// Subtitle
s1.addText("Platform Streaming 1-to-Many dengan RTMP, WebSocket FLV, dan HLS", {
  x: 0.8, y: 3.8, w: 11.7, h: 0.6,
  fontSize: 18, fontFace: "Segoe UI", color: C.secondary,
});

// Footer
s1.addText("Presentasi Proyek  |  Arsip & Demo", {
  x: 0.8, y: 6.8, w: 11.7, h: 0.4,
  fontSize: 12, fontFace: "Segoe UI", color: C.gray,
});

// ============================================================
// SLIDE 2: APA ITU STREAM BROADCAST?
// ============================================================
const s2 = pres.addSlide();
addLightBg(s2);
addTitle(s2, "Apa itu Stream Broadcast?");
addSubtitle(s2, "Solusi streaming langsung 1-to-many yang dibangun dengan TypeScript");

// 3 feature cards
const features2 = [
  { icon: "RTMP", title: "RTMP Ingest", desc: "Menerima stream dari OBS melalui protokol RTMP" },
  { icon: "WS", title: "WebSocket Relay", desc: "Mengirim stream ke viewer via HTTP-FLV dan WebSocket" },
  { icon: "ADM", title: "Admin Dashboard", desc: "Panel admin untuk mengelola user, stream key, dan viewer" },
];

features2.forEach((f, i) => {
  const x = 0.8 + i * 4.1;
  addCard(s2, x, 2.0, 3.7, 3.5);
  addAccentBar(s2, x, 2.0, 3.5, [C.primary, C.primaryLight, C.accent][i]);
  // Icon circle
  s2.addShape(pres.ShapeType.ellipse, {
    x: x + 1.35, y: 2.3, w: 1.0, h: 1.0,
    fill: { color: [C.primary, C.primaryLight, C.accent][i] },
  });
  s2.addText(f.icon, {
    x: x + 1.35, y: 2.3, w: 1.0, h: 1.0,
    fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle",
    fontFace: "Segoe UI Semibold", margin: 0,
  });
  // Title
  s2.addText(f.title, {
    x: x + 0.3, y: 3.5, w: 3.1, h: 0.5,
    fontSize: 18, bold: true, fontFace: "Segoe UI Semibold", color: C.dark, margin: 0,
  });
  // Description
  s2.addText(f.desc, {
    x: x + 0.3, y: 4.0, w: 3.1, h: 1.0,
    fontSize: 13, fontFace: "Segoe UI", color: C.gray, margin: 0,
  });
});

addFooter(s2, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 3: ARSITEKTUR
// ============================================================
const s3 = pres.addSlide();
addLightBg(s3);
addTitle(s3, "Arsitektur Sistem");
addSubtitle(s3, "Alur data dari streamer ke viewer");

// Architecture diagram using shapes
// OBS Box
addCard(s3, 0.5, 2.2, 2.5, 1.8, { fill: C.dark });
s3.addText("OBS\n(Streamer)", {
  x: 0.5, y: 2.2, w: 2.5, h: 1.8,
  fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle",
  fontFace: "Segoe UI Semibold", margin: 0,
});

// Arrow 1
s3.addShape(pres.ShapeType.rect, {
  x: 3.1, y: 3.0, w: 0.8, h: 0.06,
  fill: { color: C.primary },
});
s3.addText("RTMP\n:1935", {
  x: 2.8, y: 2.4, w: 1.5, h: 0.5,
  fontSize: 10, fontFace: "Segoe UI", color: C.primary, align: "center", margin: 0,
});

// Server Box
addCard(s3, 4.0, 2.2, 3.5, 1.8, { fill: C.primary });
s3.addText("Server\nnode-media-server", {
  x: 4.0, y: 2.2, w: 3.5, h: 1.8,
  fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle",
  fontFace: "Segoe UI Semibold", margin: 0,
});

// Arrow 2a (HTTP-FLV)
s3.addShape(pres.ShapeType.rect, {
  x: 7.6, y: 2.6, w: 1.0, h: 0.06,
  fill: { color: C.primaryLight },
});
s3.addText("HTTP-FLV\n:10080", {
  x: 7.4, y: 2.0, w: 1.5, h: 0.5,
  fontSize: 10, fontFace: "Segoe UI", color: C.primaryLight, align: "center", margin: 0,
});

// Arrow 2b (WebSocket)
s3.addShape(pres.ShapeType.rect, {
  x: 7.6, y: 3.4, w: 1.0, h: 0.06,
  fill: { color: C.accent },
});
s3.addText("WebSocket\n:8081", {
  x: 7.4, y: 3.5, w: 1.5, h: 0.5,
  fontSize: 10, fontFace: "Segoe UI", color: C.accent, align: "center", margin: 0,
});

// Arrow 2c (HLS)
s3.addShape(pres.ShapeType.rect, {
  x: 7.6, y: 3.0, w: 1.0, h: 0.06,
  fill: { color: C.secondary },
});

// Web Client Box
addCard(s3, 8.8, 1.8, 2.8, 1.5, { fill: C.darkAlt });
s3.addText("Web Client\nReact + flv.js", {
  x: 8.8, y: 1.8, w: 2.8, h: 1.5,
  fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle",
  fontFace: "Segoe UI", margin: 0,
});

// Mobile Client Box
addCard(s3, 8.8, 3.6, 2.8, 1.5, { fill: C.darkAlt });
s3.addText("Mobile Client\nReact Native + HLS", {
  x: 8.8, y: 3.6, w: 2.8, h: 1.5,
  fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle",
  fontFace: "Segoe UI", margin: 0,
});

// API Box
addCard(s3, 4.0, 4.5, 3.5, 1.2, { fill: C.grayDark });
s3.addText("HTTP API\n:8080", {
  x: 4.0, y: 4.5, w: 3.5, h: 1.2,
  fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle",
  fontFace: "Segoe UI", margin: 0,
});

// Arrow to API
s3.addShape(pres.ShapeType.rect, {
  x: 5.5, y: 4.0, w: 0.06, h: 0.5,
  fill: { color: C.gray },
});

addFooter(s3, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 4: CARA KERJA - RTMP INGEST
// ============================================================
const s4 = pres.addSlide();
addLightBg(s4);
addTitle(s4, "Cara Kerja: RTMP Ingest");
addSubtitle(s4, "Server menerima stream dari OBS dan memvalidasi stream key");

// Left: explanation
addCard(s4, 0.8, 2.0, 6.0, 4.5);
const items4 = [
  "OBS mengirim stream RTMP ke port 1935",
  "node-media-server memproses incoming stream",
  "Stream key divalidasi terhadap database SQLite",
  "Jika valid, stream ditandai sebagai LIVE",
  "GOP cache diaktifkan untuk fast playback startup",
  "Event 'stream_start' dibroadcast ke semua viewer",
];
items4.forEach((item, i) => {
  s4.addShape(pres.ShapeType.ellipse, {
    x: 1.2, y: 2.4 + i * 0.6, w: 0.15, h: 0.15,
    fill: { color: C.primary },
  });
  s4.addText(item, {
    x: 1.55, y: 2.3 + i * 0.6, w: 5.0, h: 0.4,
    fontSize: 14, fontFace: "Segoe UI", color: C.dark, margin: 0,
  });
});

// Right: config card
addCard(s4, 7.2, 2.0, 5.3, 4.5, { fill: C.dark });
s4.addText("Konfigurasi RTMP", {
  x: 7.5, y: 2.2, w: 4.7, h: 0.5,
  fontSize: 16, bold: true, color: C.primary, fontFace: "Segoe UI Semibold", margin: 0,
});
s4.addText([
  { text: "Port: ", options: { color: C.gray, bold: false } },
  { text: "1935", options: { color: C.secondary } },
  { text: "\n\nProtocol: ", options: { color: C.gray } },
  { text: "RTMP", options: { color: C.secondary } },
  { text: "\n\nGOP Cache: ", options: { color: C.gray } },
  { text: "Enabled", options: { color: C.secondary } },
  { text: "\n\nChunk Size: ", options: { color: C.gray } },
  { text: "60000", options: { color: C.secondary } },
  { text: "\n\nPing Interval: ", options: { color: C.gray } },
  { text: "30s", options: { color: C.secondary } },
  { text: "\n\nAuth: ", options: { color: C.gray } },
  { text: "Stream Key → DB", options: { color: C.accent } },
], {
  x: 7.5, y: 2.8, w: 4.7, h: 3.5,
  fontSize: 14, fontFace: "Segoe UI", color: C.white, margin: 0,
});

addFooter(s4, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 5: CARA KERJA - STREAM RELAY
// ============================================================
const s5 = pres.addSlide();
addLightBg(s5);
addTitle(s5, "Cara Kerja: Stream Relay");
addSubtitle(s5, "Server mengubah RTMP menjadi HTTP-FLV dan HLS untuk viewer");

// Two cards side by side
// FLV Card
addCard(s5, 0.8, 2.0, 5.8, 4.5);
addAccentBar(s5, 0.8, 2.0, 4.5, C.primary);
s5.addText("HTTP-FLV (Web)", {
  x: 1.1, y: 2.2, w: 5.2, h: 0.5,
  fontSize: 18, bold: true, color: C.primary, fontFace: "Segoe UI Semibold", margin: 0,
});
const flvItems = [
  "Port 10080 mengirim FLV stream",
  "CORS diaktifkan untuk akses cross-origin",
  "flv.js di browser menggunakan MSE",
  "Latency rendah (~1-3 detik)",
  "Format: /live/<streamKey>.flv",
];
flvItems.forEach((item, i) => {
  s5.addShape(pres.ShapeType.ellipse, {
    x: 1.3, y: 2.9 + i * 0.55, w: 0.12, h: 0.12,
    fill: { color: C.primary },
  });
  s5.addText(item, {
    x: 1.6, y: 2.8 + i * 0.55, w: 4.8, h: 0.4,
    fontSize: 13, fontFace: "Segoe UI", color: C.dark, margin: 0,
  });
});

// HLS Card
addCard(s5, 6.9, 2.0, 5.8, 4.5);
addAccentBar(s5, 6.9, 2.0, 4.5, C.accent);
s5.addText("HLS (Mobile)", {
  x: 7.2, y: 2.2, w: 5.2, h: 0.5,
  fontSize: 18, bold: true, color: C.accent, fontFace: "Segoe UI Semibold", margin: 0,
});
const hlsItems = [
  "Transcoding via ffmpeg",
  "Segment duration: 2 detik",
  "Playlist: 3 segmen",
  "Auto-delete segmen lama",
  "Format: /live/<streamKey>.m3u8",
  "Lebih tinggi latency (~5-10 detik)",
];
hlsItems.forEach((item, i) => {
  s5.addShape(pres.ShapeType.ellipse, {
    x: 7.4, y: 2.9 + i * 0.55, w: 0.12, h: 0.12,
    fill: { color: C.accent },
  });
  s5.addText(item, {
    x: 7.7, y: 2.8 + i * 0.55, w: 4.8, h: 0.4,
    fontSize: 13, fontFace: "Segoe UI", color: C.dark, margin: 0,
  });
});

addFooter(s5, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 6: CARA KERJA - WEBSOCKET
// ============================================================
const s6 = pres.addSlide();
addLightBg(s6);
addTitle(s6, "Cara Kerja: WebSocket Communication");
addSubtitle(s6, "Komunikasi real-time antara server, viewer, dan admin");

// Message types table
addCard(s6, 0.8, 2.0, 12.0, 4.8);

const headerRow = [
  { text: "Message Type", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI", align: "center" as const } },
  { text: "Arah", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI", align: "center" as const } },
  { text: "Deskripsi", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI", align: "center" as const } },
];

const rows = [
  ["stream_start", "Server → Client", "Memberitahu viewer bahwa stream dimulai"],
  ["stream_end", "Server → Client", "Memberitahu viewer bahwa stream berakhir"],
  ["viewer_count", "Server → Client", "Update jumlah viewer yang sedang menonton"],
  ["viewer_list", "Server → Admin", "Daftar lengkap viewer untuk panel admin"],
  ["set_volume", "Viewer → Server", "Viewer mengubah volume sendiri"],
  ["admin_set_volume", "Admin → Server → Viewer", "Admin mengubah volume viewer tertentu"],
  ["admin_set_all_volume", "Admin → Server → All", "Admin mengubah volume semua viewer"],
  ["ping", "Client → Server", "Keepalive heartbeat"],
];

const dataRows = rows.map((row, i) => row.map((cell, j) => ({
  text: cell,
  options: {
    fontSize: 11,
    fontFace: j === 0 ? "Consolas" : "Segoe UI",
    color: j === 0 ? C.primary : C.dark,
    fill: { color: i % 2 === 0 ? C.lightAlt : C.white },
    align: (j === 1 ? "center" : "left") as const,
    bold: j === 0,
  },
})));

s6.addTable([headerRow, ...dataRows], {
  x: 1.0, y: 2.2, w: 11.6, colW: [3.5, 3.5, 4.6],
  border: { pt: 0.5, color: C.grayLight },
  rowH: 0.45,
});

addFooter(s6, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 7: CARA KERJA - AUTENTIKASI & API
// ============================================================
const s7 = pres.addSlide();
addLightBg(s7);
addTitle(s7, "Cara Kerja: Autentikasi & API");
addSubtitle(s7, "Keamanan berbasis cookie dengan role-based access control");

// Auth flow
addCard(s7, 0.8, 2.0, 6.0, 4.5);
addAccentBar(s7, 0.8, 2.0, 4.5, C.primary);
s7.addText("Alur Autentikasi", {
  x: 1.1, y: 2.2, w: 5.4, h: 0.5,
  fontSize: 18, bold: true, color: C.primary, fontFace: "Segoe UI Semibold", margin: 0,
});

const authSteps = [
  "1. User login dengan username/email + password",
  "2. Password divalidasi (PBKDF2, 100k iterasi)",
  "3. Session token dibuat (HMAC-SHA256)",
  "4. Token disimpan di HttpOnly cookie",
  "5. Middleware validates token di setiap request",
  "6. Role-based access (admin/viewer)",
];
authSteps.forEach((step, i) => {
  s7.addText(step, {
    x: 1.3, y: 2.9 + i * 0.5, w: 5.2, h: 0.4,
    fontSize: 13, fontFace: "Segoe UI", color: C.dark, margin: 0,
  });
});

// API endpoints
addCard(s7, 7.1, 2.0, 5.5, 4.5);
addAccentBar(s7, 7.1, 2.0, 4.5, C.accent);
s7.addText("REST API Endpoints", {
  x: 7.4, y: 2.2, w: 5.0, h: 0.5,
  fontSize: 18, bold: true, color: C.accent, fontFace: "Segoe UI Semibold", margin: 0,
});

const endpoints = [
  ["POST /api/auth/login", "Auth"],
  ["POST /api/auth/logout", "Auth"],
  ["GET /api/auth/me", "Auth"],
  ["GET /api/users", "Admin"],
  ["POST /api/users", "Admin"],
  ["GET /api/streams", "Auth"],
  ["GET /api/stream-keys", "Admin"],
  ["POST /api/stream-keys", "Admin"],
];
endpoints.forEach((ep, i) => {
  s7.addText(ep[0], {
    x: 7.5, y: 2.85 + i * 0.4, w: 4.0, h: 0.35,
    fontSize: 11, fontFace: "Consolas", color: C.primary, margin: 0,
  });
  s7.addText(ep[1], {
    x: 11.5, y: 2.85 + i * 0.4, w: 0.9, h: 0.35,
    fontSize: 10, fontFace: "Segoe UI", color: C.gray, align: "right", margin: 0,
  });
});

addFooter(s7, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 8: FITUR - SERVER
// ============================================================
const s8 = pres.addSlide();
addDarkBg(s8);

s8.addText("Fitur: Server", {
  x: 0.8, y: 0.4, w: 11.7, h: 0.8,
  fontSize: 32, bold: true, fontFace: "Segoe UI Semibold", color: C.white,
});
s8.addShape(pres.ShapeType.rect, {
  x: 0.8, y: 1.15, w: 2.0, h: 0.04,
  fill: { color: C.primary },
});

const serverFeatures = [
  { title: "RTMP Ingest", desc: "node-media-server dengan stream key validation" },
  { title: "HTTP-FLV Relay", desc: "GOP cache untuk fast startup, CORS enabled" },
  { title: "HLS Transcoding", desc: "ffmpeg transcode ke .m3u8 dengan auto-delete" },
  { title: "WebSocket Server", desc: "Real-time viewer tracking & admin commands" },
  { title: "REST API", desc: "Express dengan cookie-based auth & RBAC" },
  { title: "SQLite Database", desc: "WAL mode untuk users, sessions, stream keys" },
  { title: "Password Security", desc: "PBKDF2 (100k iterations, SHA-256)" },
  { title: "Session Management", desc: "HMAC-SHA256 signed tokens, auto-cleanup" },
];

serverFeatures.forEach((f, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + col * 6.2;
  const y = 1.6 + row * 1.4;

  addCard(s8, x, y, 5.8, 1.2, { fill: C.darkAlt });
  addAccentBar(s8, x, y, 1.2, C.primary);
  s8.addText(f.title, {
    x: x + 0.25, y: y + 0.15, w: 5.3, h: 0.4,
    fontSize: 16, bold: true, fontFace: "Segoe UI Semibold", color: C.primary, margin: 0,
  });
  s8.addText(f.desc, {
    x: x + 0.25, y: y + 0.6, w: 5.3, h: 0.4,
    fontSize: 12, fontFace: "Segoe UI", color: C.gray, margin: 0,
  });
});

addFooter(s8, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 9: FITUR - WEB CLIENT
// ============================================================
const s9 = pres.addSlide();
addLightBg(s9);
addTitle(s9, "Fitur: Web Client");
addSubtitle(s9, "Aplikasi React dengan player FLV dan admin dashboard");

const clientFeatures = [
  { title: "FLV Player", desc: "Playback via flv.js + Media Source Extensions" },
  { title: "WebSocket Integration", desc: "Live viewer count & remote volume control" },
  { title: "Admin Dashboard", desc: "Stat cards, live preview, uptime display" },
  { title: "User Management", desc: "CRUD users dengan role assignment" },
  { title: "Stream Key Mgmt", desc: "CRUD + random key generation + active toggle" },
  { title: "Viewer Monitoring", desc: "Real-time grid dengan per-viewer volume" },
  { title: "Dark Theme", desc: "Tailwind CSS v4 dengan zinc-950 palette" },
  { title: "Indonesian UI", desc: "Label dan error message dalam Bahasa Indonesia" },
];

clientFeatures.forEach((f, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + col * 6.2;
  const y = 1.8 + row * 1.35;

  addCard(s9, x, y, 5.8, 1.15);
  addAccentBar(s9, x, y, 1.15, C.primary);
  s9.addText(f.title, {
    x: x + 0.25, y: y + 0.1, w: 5.3, h: 0.4,
    fontSize: 15, bold: true, fontFace: "Segoe UI Semibold", color: C.dark, margin: 0,
  });
  s9.addText(f.desc, {
    x: x + 0.25, y: y + 0.55, w: 5.3, h: 0.4,
    fontSize: 12, fontFace: "Segoe UI", color: C.gray, margin: 0,
  });
});

addFooter(s9, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 10: FITUR - MOBILE CLIENT
// ============================================================
const s10 = pres.addSlide();
addLightBg(s10);
addTitle(s10, "Fitur: Mobile Client");
addSubtitle(s10, "Aplikasi React Native untuk viewing di iOS dan Android");

const mobileFeatures = [
  { icon: "HLS", title: "HLS Playback", desc: "Menggunakan react-native-video untuk streaming HLS (.m3u8)" },
  { icon: "WS", title: "WebSocket", desc: "Real-time viewer count dan remote volume control" },
  { icon: "IP", title: "Manual Connect", desc: "Input server IP dan stream key secara manual" },
  { icon: "VOL", title: "Volume Control", desc: "5-dot slider dengan persentase dan mute toggle" },
];

mobileFeatures.forEach((f, i) => {
  const x = 0.8 + i * 3.1;
  addCard(s10, x, 2.0, 2.8, 3.8);
  // Icon
  s10.addShape(pres.ShapeType.ellipse, {
    x: x + 0.9, y: 2.3, w: 1.0, h: 1.0,
    fill: { color: C.primary },
  });
  s10.addText(f.icon, {
    x: x + 0.9, y: 2.3, w: 1.0, h: 1.0,
    fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle",
    fontFace: "Segoe UI Semibold", margin: 0,
  });
  s10.addText(f.title, {
    x: x + 0.2, y: 3.5, w: 2.4, h: 0.5,
    fontSize: 14, bold: true, fontFace: "Segoe UI Semibold", color: C.dark, margin: 0,
  });
  s10.addText(f.desc, {
    x: x + 0.2, y: 4.0, w: 2.4, h: 1.2,
    fontSize: 11, fontFace: "Segoe UI", color: C.gray, margin: 0,
  });
});

// Tech info card
addCard(s10, 0.8, 6.0, 12.0, 0.7, { fill: C.darkAlt });
s10.addText("Expo SDK 52  |  React Native 0.76  |  react-native-video 6.6  |  Bundle ID: com.broadcast.viewer", {
  x: 1.0, y: 6.0, w: 11.6, h: 0.7,
  fontSize: 12, fontFace: "Consolas", color: C.secondary, align: "center", valign: "middle",
  margin: 0,
});

addFooter(s10, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 11: TECH STACK
// ============================================================
const s11 = pres.addSlide();
addLightBg(s11);
addTitle(s11, "Tech Stack");
addSubtitle(s11, "Teknologi yang digunakan dalam proyek ini");

addCard(s11, 0.8, 2.0, 12.0, 4.8);

const stackHeader = [
  { text: "Layer", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 14, fontFace: "Segoe UI" } },
  { text: "Technology", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 14, fontFace: "Segoe UI" } },
  { text: "Keterangan", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 14, fontFace: "Segoe UI" } },
];

const stackData = [
  ["Language", "TypeScript (ES2022)", "Type-safe, modern JavaScript"],
  ["Package Manager", "pnpm workspaces", "Monorepo management"],
  ["RTMP Server", "node-media-server", "RTMP ingest + HTTP-FLV/HLS"],
  ["HTTP Framework", "Express.js", "REST API + static files"],
  ["WebSocket", "ws", "Real-time communication"],
  ["Database", "better-sqlite3 (SQLite)", "WAL mode, embedded DB"],
  ["Web Client", "React 18 + Vite + Tailwind CSS", "Modern frontend stack"],
  ["Mobile Client", "Expo SDK 52 + React Native", "Cross-platform mobile"],
  ["Video Player (Web)", "flv.js + MSE", "HTTP-FLV playback"],
  ["Video Player (Mobile)", "react-native-video", "HLS playback"],
  ["Auth", "PBKDF2 + HMAC-SHA256", "Password hashing + session tokens"],
];

const stackRows = stackData.map((row, i) => row.map((cell, j) => ({
  text: cell,
  options: {
    fontSize: 12,
    fontFace: j === 1 ? "Consolas" : "Segoe UI",
    color: j === 1 ? C.primary : C.dark,
    fill: { color: i % 2 === 0 ? C.lightAlt : C.white },
    bold: j === 0,
  },
})));

s11.addTable([stackHeader, ...stackRows], {
  x: 1.0, y: 2.2, w: 11.6, colW: [3.0, 4.5, 4.1],
  border: { pt: 0.5, color: C.grayLight },
  rowH: 0.4,
});

addFooter(s11, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 12: RESOURCE REQUIREMENTS - OVERVIEW
// ============================================================
const s12 = pres.addSlide();
addDarkBg(s12);

s12.addText("Kebutuhan Resource", {
  x: 0.8, y: 0.4, w: 11.7, h: 0.8,
  fontSize: 32, bold: true, fontFace: "Segoe UI Semibold", color: C.white,
});
s12.addText("1 Streamer + 100 Viewer", {
  x: 0.8, y: 1.1, w: 11.7, h: 0.5,
  fontSize: 18, fontFace: "Segoe UI", color: C.secondary,
});

// 4 stat cards
addStatCard(s12, 0.8, 2.0, 2.8, 1.6, "~600 Mbps", "Total Outbound", C.primary);
addStatCard(s12, 3.85, 2.0, 2.8, 1.6, "4-8", "CPU Cores", C.primaryLight);
addStatCard(s12, 6.9, 2.0, 2.8, 1.6, "4-8 GB", "RAM", C.accent);
addStatCard(s12, 9.95, 2.0, 2.8, 1.6, "10-50 GB", "Storage", C.primary);

// Assumptions card
addCard(s12, 0.8, 4.0, 12.0, 2.8, { fill: C.darkAlt });
s12.addText("Asumsi", {
  x: 1.1, y: 4.2, w: 11.4, h: 0.5,
  fontSize: 16, bold: true, fontFace: "Segoe UI Semibold", color: C.primary, margin: 0,
});

const assumptions = [
  ["Resolusi Stream", "1080p @ 30fps (6 Mbps)"],
  ["Protokol Inbound", "RTMP dari OBS"],
  ["Protokol Outbound (Web)", "HTTP-FLV via flv.js"],
  ["Protokol Outbound (Mobile)", "HLS via ffmpeg transcoding"],
  ["Database", "SQLite (WAL mode, embedded)"],
  ["Jumlah Streamer", "1 simultan"],
  ["Jumlah Viewer", "100 simultan"],
];

assumptions.forEach((a, i) => {
  const col = i < 4 ? 0 : 1;
  const row = i < 4 ? i : i - 4;
  const x = col === 0 ? 1.1 : 6.5;
  s12.addText(a[0], {
    x, y: 4.8 + row * 0.45, w: 2.5, h: 0.4,
    fontSize: 12, fontFace: "Segoe UI", color: C.gray, margin: 0,
  });
  s12.addText(a[1], {
    x: x + 2.5, y: 4.8 + row * 0.45, w: 3.5, h: 0.4,
    fontSize: 12, fontFace: "Segoe UI", color: C.white, margin: 0,
  });
});

addFooter(s12, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 13: BANDWIDTH BREAKDOWN
// ============================================================
const s13 = pres.addSlide();
addLightBg(s13);
addTitle(s13, "Rincian Bandwidth");
addSubtitle(s13, "Analisis throughput untuk 1 streamer + 100 viewer");

// Inbound
addCard(s13, 0.8, 2.0, 5.8, 2.2);
addAccentBar(s13, 0.8, 2.0, 2.2, C.primary);
s13.addText("Inbound (RTMP Ingest)", {
  x: 1.1, y: 2.15, w: 5.2, h: 0.5,
  fontSize: 16, bold: true, fontFace: "Segoe UI Semibold", color: C.primary, margin: 0,
});
s13.addText("1 streamer x 6 Mbps = 6 Mbps", {
  x: 1.3, y: 2.7, w: 5.0, h: 0.4,
  fontSize: 14, fontFace: "Segoe UI", color: C.dark, margin: 0,
});
s13.addText("Sangat ringan untuk server", {
  x: 1.3, y: 3.15, w: 5.0, h: 0.4,
  fontSize: 12, fontFace: "Segoe UI", color: C.gray, margin: 0,
});

// Outbound
addCard(s13, 6.9, 2.0, 5.8, 2.2);
addAccentBar(s13, 6.9, 2.0, 2.2, C.accent);
s13.addText("Outbound (Stream Relay)", {
  x: 7.2, y: 2.15, w: 5.2, h: 0.5,
  fontSize: 16, bold: true, fontFace: "Segoe UI Semibold", color: C.accent, margin: 0,
});
s13.addText("100 viewer x 6 Mbps = 600 Mbps", {
  x: 7.4, y: 2.7, w: 5.0, h: 0.4,
  fontSize: 14, fontFace: "Segoe UI", color: C.dark, margin: 0,
});
s13.addText("Beban utama server — perlu jaringan 1 Gbps+", {
  x: 7.4, y: 3.15, w: 5.0, h: 0.4,
  fontSize: 12, fontFace: "Segoe UI", color: C.gray, margin: 0,
});

// Bandwidth table
addCard(s13, 0.8, 4.5, 12.0, 2.2);

const bwHeader = [
  { text: "Komponen", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 12, fontFace: "Segoe UI" } },
  { text: "Per-Koneksi", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 12, fontFace: "Segoe UI", align: "center" as const } },
  { text: "Jumlah", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 12, fontFace: "Segoe UI", align: "center" as const } },
  { text: "Total", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 12, fontFace: "Segoe UI", align: "center" as const } },
];

const bwData = [
  ["RTMP Ingest (OBS → Server)", "6 Mbps", "1", "6 Mbps"],
  ["HTTP-FLV (Server → Web)", "6 Mbps", "~80", "480 Mbps"],
  ["HLS (Server → Mobile)", "6 Mbps", "~20", "120 Mbps"],
  ["WebSocket (State Sync)", "~1 KB/s", "100", "~0.1 Mbps"],
].map((row, i) => row.map((cell, j) => ({
  text: cell,
  options: {
    fontSize: 12,
    fontFace: j === 0 ? "Segoe UI" : "Consolas",
    color: C.dark,
    fill: { color: i % 2 === 0 ? C.lightAlt : C.white },
    align: (j > 0 ? "center" : "left") as const,
  },
})));

s13.addTable([bwHeader, ...bwData], {
  x: 1.0, y: 4.65, w: 11.6, colW: [5.0, 2.2, 2.2, 2.2],
  border: { pt: 0.5, color: C.grayLight },
  rowH: 0.38,
});

addFooter(s13, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 14: SERVER SPEC
// ============================================================
const s14 = pres.addSlide();
addLightBg(s14);
addTitle(s14, "Rincian Spesifikasi Server");
addSubtitle(s14, "Hardware dan resource yang direkomendasikan");

// Spec table
addCard(s14, 0.8, 2.0, 7.0, 4.8);

const specHeader = [
  { text: "Resource", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI" } },
  { text: "Minimum", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI", align: "center" as const } },
  { text: "Recommended", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI", align: "center" as const } },
];

const specData = [
  ["CPU Cores", "4 cores", "8 cores"],
  ["RAM", "4 GB", "8 GB"],
  ["Storage", "10 GB SSD", "50 GB SSD"],
  ["Network", "100 Mbps", "1 Gbps+"],
  ["OS", "Linux (Ubuntu 22+)", "Linux (Ubuntu 22+)"],
  ["Node.js", ">= 18", "20 LTS"],
  ["ffmpeg", "Required", "6.x+"],
].map((row, i) => row.map((cell, j) => ({
  text: cell,
  options: {
    fontSize: 12,
    fontFace: "Segoe UI",
    color: j === 2 ? C.primary : C.dark,
    fill: { color: i % 2 === 0 ? C.lightAlt : C.white },
    align: (j > 0 ? "center" : "left") as const,
    bold: j === 2,
  },
})));

s14.addTable([specHeader, ...specData], {
  x: 1.0, y: 2.2, w: 6.6, colW: [2.4, 2.1, 2.1],
  border: { pt: 0.5, color: C.grayLight },
  rowH: 0.42,
});

// Port summary
addCard(s14, 8.1, 2.0, 4.5, 4.8);
addAccentBar(s14, 8.1, 2.0, 4.8, C.accent);
s14.addText("Port yang Digunakan", {
  x: 8.4, y: 2.15, w: 4.0, h: 0.5,
  fontSize: 16, bold: true, fontFace: "Segoe UI Semibold", color: C.accent, margin: 0,
});

const ports = [
  { port: "1935", proto: "RTMP", use: "Stream Ingest" },
  { port: "8080", proto: "HTTP", use: "REST API" },
  { port: "8081", proto: "WS", use: "WebSocket" },
  { port: "10080", proto: "HTTP", use: "FLV/HLS Relay" },
];

ports.forEach((p, i) => {
  const y = 2.8 + i * 0.9;
  s14.addText(p.port, {
    x: 8.4, y, w: 1.2, h: 0.4,
    fontSize: 22, bold: true, fontFace: "Consolas", color: C.primary, margin: 0,
  });
  s14.addText(p.proto, {
    x: 9.7, y, w: 1.0, h: 0.4,
    fontSize: 11, fontFace: "Segoe UI", color: C.gray, margin: 0,
  });
  s14.addText(p.use, {
    x: 8.4, y: y + 0.35, w: 4.0, h: 0.3,
    fontSize: 11, fontFace: "Segoe UI", color: C.dark, margin: 0,
  });
});

addFooter(s14, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 15: PER-VIEWER COST
// ============================================================
const s15 = pres.addSlide();
addLightBg(s15);
addTitle(s15, "Biaya Per-Viewer");
addSubtitle(s15, "Resource yang dibutuhkan per koneksi viewer");

addCard(s15, 0.8, 2.0, 12.0, 4.5);

const pvHeader = [
  { text: "Metric", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI" } },
  { text: "Per Viewer", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI", align: "center" as const } },
  { text: "x 100 Viewers", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI", align: "center" as const } },
  { text: "Catatan", options: { bold: true, color: C.white, fill: { color: C.primary }, fontSize: 13, fontFace: "Segoe UI" } },
];

const pvData = [
  ["Bandwidth (Outbound)", "6 Mbps", "600 Mbps", "Beban utama — perlu 1 Gbps NIC"],
  ["RAM (Connection State)", "~50 KB", "~5 MB", "WebSocket + FLV buffer state"],
  ["CPU (per stream relay)", "~0.5%", "~50%", "FFmpeg HLS transcoding paling berat"],
  ["Disk I/O (HLS segments)", "~50 KB/s", "~5 MB/s", "Auto-delete setelah 6 detik"],
  ["WebSocket Messages", "~1 KB/s", "~100 KB/s", "Viewer count + volume sync"],
  ["File Descriptors", "~3", "~300", "Socket + file handles"],
].map((row, i) => row.map((cell, j) => ({
  text: cell,
  options: {
    fontSize: 12,
    fontFace: j === 0 ? "Segoe UI" : "Consolas",
    color: C.dark,
    fill: { color: i % 2 === 0 ? C.lightAlt : C.white },
    align: (j > 0 && j < 3 ? "center" : "left") as const,
    bold: j === 0,
  },
})));

s15.addTable([pvHeader, ...pvData], {
  x: 1.0, y: 2.2, w: 11.6, colW: [3.0, 2.2, 2.2, 4.2],
  border: { pt: 0.5, color: C.grayLight },
  rowH: 0.45,
});

addFooter(s15, "Stream Broadcast  |  Presentasi Proyek");

// ============================================================
// SLIDE 16: RINGKASAN & TERIMA KASIH
// ============================================================
const s16 = pres.addSlide();
addDarkBg(s16);

// Decorative circles
s16.addShape(pres.ShapeType.ellipse, {
  x: 9, y: -1, w: 5, h: 5,
  fill: { color: C.primary, transparency: 90 },
});
s16.addShape(pres.ShapeType.ellipse, {
  x: -1, y: 4, w: 4, h: 4,
  fill: { color: C.secondary, transparency: 92 },
});

s16.addText("Ringkasan", {
  x: 0.8, y: 0.8, w: 11.7, h: 0.8,
  fontSize: 36, bold: true, fontFace: "Segoe UI Semibold", color: C.white,
});

s16.addShape(pres.ShapeType.rect, {
  x: 0.8, y: 1.6, w: 2.0, h: 0.04,
  fill: { color: C.primary },
});

const summaryItems = [
  "Platform streaming 1-to-many berbasis TypeScript",
  "RTMP ingest dari OBS dengan validasi stream key",
  "HTTP-FLV untuk web (latency rendah) + HLS untuk mobile",
  "Admin dashboard lengkap dengan user & viewer management",
  "Mobile app dengan Expo SDK untuk iOS & Android",
  "Untuk 1 streamer + 100 viewer: 4-8 core CPU, 8 GB RAM, 1 Gbps NIC",
];

summaryItems.forEach((item, i) => {
  s16.addShape(pres.ShapeType.ellipse, {
    x: 1.0, y: 2.15 + i * 0.55, w: 0.12, h: 0.12,
    fill: { color: C.primary },
  });
  s16.addText(item, {
    x: 1.35, y: 2.0 + i * 0.55, w: 11.0, h: 0.45,
    fontSize: 15, fontFace: "Segoe UI", color: C.light, margin: 0,
  });
});

// Thank you
s16.addText("Terima Kasih", {
  x: 0.8, y: 5.8, w: 11.7, h: 0.8,
  fontSize: 28, bold: true, fontFace: "Segoe UI Semibold", color: C.secondary,
  align: "center",
});

// ============================================================
// SAVE
// ============================================================
const outputPath = "/home/frdiskndr/code/project/stream-broadcast/stream-broadcast-presentation.pptx";
await pres.writeFile({ fileName: outputPath });
console.log(`Presentation saved to ${outputPath}`);

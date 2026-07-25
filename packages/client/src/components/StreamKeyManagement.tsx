import { useState, useEffect, type FormEvent } from "react";
import type { StreamKeyProfile } from "@broadcast/shared";

interface KeyForm {
  name: string;
  key: string;
  isActive: boolean;
}

const emptyForm: KeyForm = { name: "", key: "", isActive: true };

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatDate(ts?: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StreamKeyManagement() {
  const [keys, setKeys] = useState<StreamKeyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<KeyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/stream-keys");
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      setKeys(data.streamKeys || []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setForm({ name: "", key: generateKey(), isActive: true });
    setEditingId(null);
    setShowForm(true);
    setError("");
  }

  function startEdit(sk: StreamKeyProfile) {
    setForm({ name: sk.name, key: sk.key, isActive: sk.isActive });
    setEditingId(sk.id);
    setShowForm(true);
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (editingId) {
        const res = await fetch(`/api/stream-keys/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      } else {
        const res = await fetch("/api/stream-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      }
      await fetchKeys();
      cancelForm();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus stream key "${name}"?`)) return;
    try {
      const res = await fetch(`/api/stream-keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }
      await fetchKeys();
    } catch {
      alert("Gagal menghapus stream key");
    }
  }

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  if (loading) {
    return <div style={{ padding: 24, color: "#71717a" }}>Memuat data stream key...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e4e4e7", margin: 0 }}>
          Stream Keys ({keys.length})
        </h2>
        <button onClick={startCreate} style={createBtnStyle}>
          + Tambah Stream Key
        </button>
      </div>

      {showForm && (
        <div style={formCardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7", margin: "0 0 16px" }}>
            {editingId ? "Edit Stream Key" : "Tambah Stream Key Baru"}
          </h3>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Nama</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: OBS Studio"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Stream Key</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    required
                    style={{ ...inputStyle, flex: 1, fontFamily: "'SF Mono', Consolas, monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, key: generateKey() })}
                    style={generateBtnStyle}
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Status</label>
              <select
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
                style={inputStyle}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={submitting} style={submitBtnStyle}>
                {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Stream Key"}
              </button>
              <button type="button" onClick={cancelForm} style={cancelBtnStyle}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nama</th>
              <th style={thStyle}>Stream Key</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Terakhir Digunakan</th>
              <th style={thStyle}>Dibuat</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#71717a" }}>
                  Belum ada stream key
                </td>
              </tr>
            ) : (
              keys.map((sk) => (
                <tr key={sk.id} style={trStyle}>
                  <td style={tdStyle}>{sk.name}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <code style={codeStyle}>{sk.key}</code>
                      <button
                        onClick={() => copyKey(sk.key, sk.id)}
                        style={copyBtnStyle}
                        title="Salin key"
                      >
                        {copiedId === sk.id ? "✓" : "📋"}
                      </button>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={sk.isActive ? activeBadgeStyle : inactiveBadgeStyle}>
                      {sk.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "'SF Mono', Consolas, monospace", fontSize: 12, color: "#71717a" }}>
                    {formatDate(sk.lastUsedAt)}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "'SF Mono', Consolas, monospace", fontSize: 12, color: "#71717a" }}>
                    {formatDate(sk.createdAt)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button onClick={() => startEdit(sk)} style={editBtnStyle}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(sk.id, sk.name)} style={deleteBtnStyle}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const createBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "#22c55e",
  border: "none",
  borderRadius: 6,
  color: "#000",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const formCardStyle: React.CSSProperties = {
  padding: 20,
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
  marginBottom: 20,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#71717a",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "#0f0f0f",
  border: "1px solid #27272a",
  borderRadius: 6,
  color: "#e4e4e7",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const generateBtnStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "#27272a",
  border: "1px solid #3f3f46",
  borderRadius: 6,
  color: "#a1a1aa",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "system-ui, -apple-system, sans-serif",
  whiteSpace: "nowrap" as const,
};

const submitBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#22c55e",
  border: "none",
  borderRadius: 6,
  color: "#000",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  border: "1px solid #27272a",
  borderRadius: 6,
  color: "#a1a1aa",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const tableWrapperStyle: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
  overflow: "hidden",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: 12,
  color: "#71717a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  borderBottom: "1px solid #27272a",
  fontWeight: 500,
};

const trStyle: React.CSSProperties = {
  borderBottom: "1px solid #27272a",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: 14,
};

const codeStyle: React.CSSProperties = {
  background: "#27272a",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "'SF Mono', Consolas, monospace",
};

const copyBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 12,
  padding: "2px 4px",
};

const activeBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  background: "rgba(34, 197, 94, 0.15)",
  color: "#22c55e",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
};

const inactiveBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  background: "rgba(239, 68, 68, 0.15)",
  color: "#ef4444",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
};

const editBtnStyle: React.CSSProperties = {
  padding: "4px 10px",
  background: "transparent",
  border: "1px solid #27272a",
  borderRadius: 4,
  color: "#a1a1aa",
  fontSize: 12,
  cursor: "pointer",
  marginRight: 6,
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const deleteBtnStyle: React.CSSProperties = {
  padding: "4px 10px",
  background: "transparent",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: 4,
  color: "#ef4444",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const errorStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "rgba(239, 68, 68, 0.15)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: 6,
  color: "#ef4444",
  fontSize: 13,
  marginBottom: 12,
};

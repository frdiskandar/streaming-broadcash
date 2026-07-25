import { useState, useEffect, type FormEvent } from "react";
import type { UserProfile } from "@broadcast/shared";

interface UserForm {
  username: string;
  email: string;
  password: string;
  role: "admin" | "viewer";
}

const emptyForm: UserForm = { username: "", email: "", password: "", role: "viewer" };

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/";
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
  }

  function startEdit(user: UserProfile) {
    setForm({ username: user.username, email: user.email, password: "", role: user.role });
    setEditingId(user.id);
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
        const body: any = { username: form.username, email: form.email, role: form.role };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/users/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      } else {
        if (!form.password) {
          throw new Error("Password harus diisi");
        }
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      }
      await fetchUsers();
      cancelForm();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Hapus pengguna "${username}"?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }
      await fetchUsers();
    } catch {
      alert("Gagal menghapus pengguna");
    }
  }

  if (loading) {
    return <div style={{ padding: 24, color: "#71717a" }}>Memuat data pengguna...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e4e4e7", margin: 0 }}>
          Pengguna ({users.length})
        </h2>
        <button onClick={startCreate} style={createBtnStyle}>
          + Tambah Pengguna
        </button>
      </div>

      {showForm && (
        <div style={formCardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7", margin: "0 0 16px" }}>
            {editingId ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          </h3>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>
                  Password {editingId && "(kosongkan jika tidak diubah)"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "viewer" })}
                  style={inputStyle}
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={submitting} style={submitBtnStyle}>
                {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Pengguna"}
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
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Dibuat</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#71717a" }}>
                  Belum ada pengguna
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={trStyle}>
                  <td style={tdStyle}>
                    <code style={codeStyle}>{user.username}</code>
                  </td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>
                    <span style={user.role === "admin" ? adminBadgeStyle : viewerBadgeStyle}>
                      {user.role === "admin" ? "Admin" : "Viewer"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "'SF Mono', Consolas, monospace", fontSize: 13, color: "#71717a" }}>
                    {new Date(user.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button onClick={() => startEdit(user)} style={editBtnStyle}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(user.id, user.username)} style={deleteBtnStyle}>
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
  fontSize: 13,
  fontFamily: "'SF Mono', Consolas, monospace",
};

const adminBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  background: "rgba(234, 179, 8, 0.15)",
  color: "#eab308",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
};

const viewerBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  background: "rgba(59, 130, 246, 0.15)",
  color: "#3b82f6",
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

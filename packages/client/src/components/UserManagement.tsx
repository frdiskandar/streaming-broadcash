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
    return <div className="px-6 py-6 text-sm text-zinc-400">Memuat data pengguna...</div>;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="m-0 text-base font-semibold text-zinc-200">
          Pengguna ({users.length})
        </h2>
        <button onClick={startCreate} className="rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400">
          + Tambah Pengguna
        </button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-200">
            {editingId ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          </h3>

          {error && <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Password {editingId && "(kosongkan jika tidak diubah)"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "viewer" })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Pengguna"}
              </button>
              <button type="button" onClick={cancelForm} className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-zinc-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-zinc-400">Username</th>
              <th className="border-b border-zinc-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-zinc-400">Email</th>
              <th className="border-b border-zinc-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-zinc-400">Role</th>
              <th className="border-b border-zinc-800 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-zinc-400">Dibuat</th>
              <th className="border-b border-zinc-800 px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-zinc-400">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-zinc-400">
                  Belum ada pengguna
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800 last:border-b-0">
                  <td className="px-4 py-3 text-sm text-zinc-200">
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[13px] text-zinc-100">{user.username}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={user.role === "admin" ? "inline-block rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400" : "inline-block rounded bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-400"}>
                      {user.role === "admin" ? "Admin" : "Viewer"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-400">
                    {new Date(user.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(user)} className="mr-2 rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(user.id, user.username)} className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-500/10">
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

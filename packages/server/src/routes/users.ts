import { Router } from "express";
import { generateId, hashPassword } from "../lib/crypto.js";
import {
  getAllUsers,
  createUser,
  findUserById,
  updateUser,
  deleteUser,
  existsByUsernameOrEmail,
  toUserProfile,
} from "../services/user.service.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import type { User } from "@broadcast/shared";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", (_req, res) => {
  res.json({ users: getAllUsers() });
});

router.post("/", (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: "Username, email, dan password harus diisi" });
    return;
  }

  if (existsByUsernameOrEmail(username, email)) {
    res.status(409).json({ error: "Username atau email sudah digunakan" });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const newUser: User = {
    id: generateId(),
    username,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    role: role === "admin" ? "admin" : "viewer",
    createdAt: Date.now(),
  };
  createUser(newUser);

  res.status(201).json({ user: toUserProfile(newUser) });
});

router.put("/:id", (req, res) => {
  const user = findUserById(req.params.id as string);
  if (!user) {
    res.status(404).json({ error: "Pengguna tidak ditemukan" });
    return;
  }

  const { username, email, password, role } = req.body;

  if (username && username !== user.username) {
    if (existsByUsernameOrEmail(username, user.email, user.id)) {
      res.status(409).json({ error: "Username sudah digunakan" });
      return;
    }
  }

  if (email && email !== user.email) {
    if (existsByUsernameOrEmail(user.username, email, user.id)) {
      res.status(409).json({ error: "Email sudah digunakan" });
      return;
    }
  }

  const updateData: any = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (password) {
    const { hash, salt } = hashPassword(password);
    updateData.passwordHash = hash;
    updateData.passwordSalt = salt;
  }
  if (role === "admin" || role === "viewer") updateData.role = role;

  updateUser(user.id, updateData);
  const updated = findUserById(user.id)!;
  res.json({ user: toUserProfile(updated) });
});

router.delete("/:id", (req, res) => {
  const currentUser = (req as any).user as User;
  const user = findUserById(req.params.id as string);
  if (!user) {
    res.status(404).json({ error: "Pengguna tidak ditemukan" });
    return;
  }
  if (user.id === currentUser.id) {
    res.status(400).json({ error: "Tidak bisa menghapus akun sendiri" });
    return;
  }

  deleteUser(user.id);
  res.json({ ok: true });
});

export default router;

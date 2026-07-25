import { Router } from "express";
import crypto from "crypto";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getAllStreamKeys,
  createStreamKey,
  findStreamKeyById,
  updateStreamKey,
  deleteStreamKey,
  existsByKey,
  toStreamKeyProfile,
} from "../services/stream-key.service.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", (_req, res) => {
  res.json({ streamKeys: getAllStreamKeys() });
});

router.post("/", (req, res) => {
  const { name, key, isActive } = req.body;
  if (!name || !key) {
    res.status(400).json({ error: "Nama dan key harus diisi" });
    return;
  }

  if (existsByKey(key)) {
    res.status(409).json({ error: "Stream key sudah digunakan" });
    return;
  }

  const streamKey = createStreamKey({ key, name, isActive });
  res.status(201).json({ streamKey: toStreamKeyProfile(streamKey) });
});

router.put("/:id", (req, res) => {
  const existing = findStreamKeyById(req.params.id as string);
  if (!existing) {
    res.status(404).json({ error: "Stream key tidak ditemukan" });
    return;
  }

  const { name, key, isActive } = req.body;

  if (key && key !== existing.key) {
    if (existsByKey(key, existing.id)) {
      res.status(409).json({ error: "Stream key sudah digunakan" });
      return;
    }
  }

  const updateData: any = {};
  if (name) updateData.name = name;
  if (key) updateData.key = key;
  if (isActive !== undefined) updateData.isActive = isActive;

  updateStreamKey(existing.id, updateData);
  const updated = findStreamKeyById(existing.id)!;
  res.json({ streamKey: toStreamKeyProfile(updated) });
});

router.delete("/:id", (req, res) => {
  const existing = findStreamKeyById(req.params.id as string);
  if (!existing) {
    res.status(404).json({ error: "Stream key tidak ditemukan" });
    return;
  }

  deleteStreamKey(existing.id);
  res.json({ ok: true });
});

export default router;

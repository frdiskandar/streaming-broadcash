import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getLiveStreams, getStream } from "../services/stream.service.js";

const router = Router();

router.use(requireAuth);

router.get("/", (_req, res) => {
  res.json({ streams: getLiveStreams() });
});

router.get("/:key", (req, res) => {
  const info = getStream(req.params.key as string);
  if (!info || !info.isLive) {
    res.status(404).json({ error: "Stream not found" });
    return;
  }
  res.json(info);
});

export default router;

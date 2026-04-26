import express from "express";
import IORedis from "ioredis";

const router = express.Router();

const redis = new IORedis({
  maxRetriesPerRequest: null,
});

router.get("/:jobId", async (req, res) => {
  const { jobId } = req.params;

  const result = await redis.get(`result:${jobId}`);

  if (!result) {
    return res.json({ status: "running" });
  }

  res.json(JSON.parse(result));
});

export default router;
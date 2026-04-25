import express from "express";
import { codeQueue } from "../queue/queue.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.post("/", async (req, res) => {
  const { files, mainClass } = req.body;

  const jobId = uuidv4();

  await codeQueue.add("run-code", {
    jobId,
    files,
    mainClass,
  });

  res.json({ jobId, status: "queued" });
});

export default router;
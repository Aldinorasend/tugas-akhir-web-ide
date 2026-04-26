import { Worker } from "bullmq";
import IORedis from "ioredis";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const connection = new IORedis({
  maxRetriesPerRequest: null,
});

// 👉 separate redis instance for result storage
const redis = new IORedis({
  maxRetriesPerRequest: null,
});

console.log("🚀 Worker started...");

new Worker(
  "code-execution",
  async (job) => {
    const { files, mainClass, jobId } = job.data;

    console.log("📥 Job received:", jobId);

    const projectDir = path.join("tmp", jobId);
    fs.mkdirSync(projectDir, { recursive: true });

    // write files
    files.forEach((file) => {
      const filePath = path.join(projectDir, file.path);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, file.content);
    });

    return new Promise((resolve) => {
const command = `docker run --rm -v "${path.resolve(projectDir).replace(/\\/g, "/")}:/app" -w /app eclipse-temurin:17 sh -c "javac *.java && echo -e '${input || ""}' | java ${mainClass}"`;
     exec(command, { timeout: 5000 }, async (err, stdout, stderr) => {
        console.log("COMMAND:", command);
        console.log("ERROR:", err);
        console.log("STDOUT:", stdout);
        console.log("STDERR:", stderr);
        // cleanup
        fs.rmSync(projectDir, { recursive: true, force: true });

        const result = err
          ? { status: "error", output: stderr }
          : { status: "success", output: stdout };

        // ✅ store result in redis
        await redis.set(
          `result:${jobId}`,
          JSON.stringify(result),
          "EX",
          60
        );

        console.log("✅ Job done:", jobId);

        resolve(result);
      });
    });
  },
  { connection }
);
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const wss = new WebSocketServer({ port: 8080 });

console.log("🔥 WebSocket running on ws://localhost:8080");

wss.on("connection", (ws) => {
  console.log("Client connected");

  let dockerProcess = null;

  ws.on("message", async (message) => {
    const data = JSON.parse(message);

    // 👉 START EXECUTION
    if (data.type === "run") {
      const { files, mainClass } = data;

      const projectDir = path.join("tmp", Date.now().toString());
      fs.mkdirSync(projectDir, { recursive: true });

      files.forEach((file) => {
        const filePath = path.join(projectDir, file.path);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content);
      });

      const volumePath = path.resolve(projectDir).replace(/\\/g, "/");
      console.log("Running Docker with path:", volumePath);

dockerProcess = spawn("docker", [
  "run",
  "-i", // 🔥 interactive + terminal
  "--rm",
  "--memory=256m",
  "--cpus=0.5",
  "--network=none",
  "-v",
  `${volumePath}:/app`,
  "-w",
  "/app",
  "eclipse-temurin:17",
  "sh",
  "-c",
  `javac $(find . -name "*.java") && java ${mainClass}`,
]);

dockerProcess.on("error", (err) => {
  console.error("Docker spawn error:", err);
});
      // stdout → frontend
      dockerProcess.stdout.on("data", (data) => {
        ws.send(JSON.stringify({ type: "output", data: data.toString() }));
      });

      // stderr → frontend
      dockerProcess.stderr.on("data", (data) => {
        ws.send(JSON.stringify({ type: "error", data: data.toString() }));
      });

      dockerProcess.on("close", () => {
        ws.send(JSON.stringify({ type: "end" }));
        fs.rmSync(projectDir, { recursive: true, force: true });
      });
    }

    // 👉 SEND INPUT
    if (data.type === "input") {
      if (dockerProcess) {
        dockerProcess.stdin.write(data.data + "\n");
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (dockerProcess) dockerProcess.kill();
  });
});
// import { WebSocketServer } from "ws";
// import { spawn } from "child_process";
// import path from "path";
// import fs from "fs";

// // 1. Kita jadikan fungsi export agar bisa dipanggil oleh server.js utama
// export const initWebSocket = (httpServer) => {
//     // 2. Tempelkan WebSocket ke httpServer (berjalan di port yang sama dengan Express)
//     const wss = new WebSocketServer({ server: httpServer });

//     console.log("🔥 WebSocket is attached and ready!");

//     wss.on("connection", (ws) => {
//         console.log("Client connected");

//         let dockerProcess = null;

//         ws.on("message", async (message) => {
//             const data = JSON.parse(message);

//             if (data.type === "run") {
//                 const { files, mainClass } = data;

//                 const projectDir = path.join("tmp", Date.now().toString());
//                 fs.mkdirSync(projectDir, { recursive: true });

//                 files.forEach((file) => {
//                     const filePath = path.join(projectDir, file.path);
//                     fs.mkdirSync(path.dirname(filePath), { recursive: true });
//                     fs.writeFileSync(filePath, file.content);
//                 });

//                 const volumePath = path.resolve(projectDir).replace(/\\/g, "/");
//                 console.log("Running Docker with path:", volumePath);

//                 dockerProcess = spawn("docker", [
//                     "run",
//                     "-i",
//                     "--rm",
//                     "--memory=256m",
//                     "--cpus=0.5",
//                     "--network=none",
//                     "-v",
//                     `${volumePath}:/app`,
//                     "-w",
//                     "/app",
//                     "eclipse-temurin:17",
//                     "sh",
//                     "-c",
//                     `javac $(find . -name "*.java") && java ${mainClass}`,
//                 ]);

//                 dockerProcess.on("error", (err) => {
//                     console.error("Docker spawn error:", err);
//                 });

//                 // stdout → frontend
//                 dockerProcess.stdout.on("data", (data) => {
//                     ws.send(JSON.stringify({ type: "output", data: data.toString() }));
//                 });

//                 // stderr → frontend
//                 dockerProcess.stderr.on("data", (data) => {
//                     ws.send(JSON.stringify({ type: "error", data: data.toString() }));
//                 });

//                 dockerProcess.on("close", () => {
//                     ws.send(JSON.stringify({ type: "end" }));
//                     // Kak Gem tambahkan try-catch agar server tidak crash jika file sedang di-lock
//                     try {
//                         fs.rmSync(projectDir, { recursive: true, force: true });
//                     } catch (err) {
//                         console.error("Gagal menghapus folder tmp:", err.message);
//                     }
//                 });
//             }

//             if (data.type === "input") {
//                 if (dockerProcess) {
//                     dockerProcess.stdin.write(data.data + "\n");
//                 }
//             }
//         });

//         ws.on("close", () => {
//             console.log("Client disconnected");
//             if (dockerProcess) {
//                 dockerProcess.kill();
//             }
//         });
//     });
// };

import { executeCompilation } from "../core/compiler/compileService.js";
import { WebSocketServer } from "ws";
// Di dalam wss.on("connection", (ws) => { ... })
export const initWebSocket = (httpServer) => {
    const wss = new WebSocketServer({ server: httpServer });

    wss.on("connection", (ws) => {
        console.log("Client connected to Pathwise Engine");

        ws.on("message", async (message) => {
            const data = JSON.parse(message);

            if (data.type === "run") {
                // Memanggil Service Layer sesuai arsitektur Tier 2
                ws.dockerProcess = await executeCompilation(data.files, data.mainClass, ws);
            }

            if (data.type === "input" && ws.dockerProcess) {
                ws.dockerProcess.stdin.write(data.data + "\n");
            }
        });

        ws.on("close", () => {
            if (ws.dockerProcess) ws.dockerProcess.kill();
        });
    });
};
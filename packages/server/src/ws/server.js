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
import path from "path";
import fs from "fs";
import { runJavaInDocker } from "./dockerEngine.js";

export const executeCompilation = async (files, mainClass, socket) => {
    const projectDir = path.join("tmp", Date.now().toString());

    try {
        // 1. Setup Environment
        fs.mkdirSync(projectDir, { recursive: true });
        files.forEach((file) => {
            const filePath = path.join(projectDir, file.path);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, file.content);
        });

        const volumePath = path.resolve(projectDir).replace(/\\/g, "/");

        // 2. Execute via Core Layer
        const process = runJavaInDocker(
            volumePath,
            mainClass,
            (data) => socket.send(JSON.stringify({ type: "output", data })),
            (data) => socket.send(JSON.stringify({ type: "error", data })),
            () => {
                socket.send(JSON.stringify({ type: "end" }));
                cleanup(projectDir);
            }
        );

        return process;
    } catch (err) {
        socket.send(JSON.stringify({ type: "error", data: err.message }));
        cleanup(projectDir);
    }
};

const cleanup = (dir) => {
    try {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    } catch (e) {
        console.error("Cleanup error:", e.message);
    }
};
import { spawn } from "child_process";

export const runJavaInDocker = (volumePath, mainClass, onData, onError, onEnd) => {
    const dockerProcess = spawn("docker", [
        "run", "-i", "--rm",
        "--memory=256m", "--cpus=0.5", "--network=none",
        "-v", `${volumePath}:/app`,
        "-w", "/app",
        "eclipse-temurin:17",
        "sh", "-c", `javac $(find . -name "*.java") && java ${mainClass}`,
    ]);

    dockerProcess.stdout.on("data", (data) => onData(data.toString()));
    dockerProcess.stderr.on("data", (data) => onError(data.toString()));
    dockerProcess.on("close", () => onEnd());

    return dockerProcess;
};
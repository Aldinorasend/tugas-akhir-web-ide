import { useEffect, useRef, useState, useCallback } from 'react';

export const useSocket = (url: string = "ws://localhost:4000") => {
    const [output, setOutput] = useState<string>("");
    const [isRunning, setRunning] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<WebSocket | null>(null);

    // PERBAIKAN DI SINI: Berikan argumen undefined
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const connect = useCallback(() => {
        // Hindari double connection
        if (socketRef.current?.readyState === WebSocket.OPEN ||
            socketRef.current?.readyState === WebSocket.CONNECTING) return;

        console.log("🔌 Connecting to Pathwise WebSocket...");
        const socket = new WebSocket(url);

        socket.onopen = () => {
            console.log("✅ Connected to Server");
            setIsConnected(true);
            socketRef.current = socket;
        };

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "output" || msg.type === "error") {
                    setOutput((prev) => prev + msg.data);
                }
                if (msg.type === "end") {
                    setRunning(false);
                }
            } catch (err) {
                console.error("Gagal parsing pesan socket:", err);
            }
        };

        socket.onclose = () => {
            console.log("🔌 Disconnected. Reconnecting in 3s...");
            setIsConnected(false);
            socketRef.current = null;
            // Auto-reconnect
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
            console.error("❌ WebSocket Error:", err);
            socket.close();
        };
    }, [url]);

    useEffect(() => {
        connect(); // Panggil koneksi saat pertama kali mount

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    const runJavaCode = useCallback((nodes: any[], selectedId: string, flattenFiles: (nodes: any[]) => any[]) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            // Lebih user-friendly daripada alert: kasih feedback di output panel
            setOutput("⚠️ Error: Execution server is offline. Please wait or restart your backend.\n");
            return;
        }

        setOutput("Output:\n");
        setRunning(true);

        const filesToSend = flattenFiles(nodes);
        const currentDirPath = selectedId.includes("/")
            ? selectedId.split("/").slice(0, -1).join("/")
            : "";

        let mainFile = filesToSend.find(f => f.path === (currentDirPath ? `${currentDirPath}/Main.java` : "Main.java"));
        if (!mainFile) {
            mainFile = filesToSend.find(f => f.path.endsWith("Main.java"));
        }

        let mainClass = "Main";
        if (mainFile) {
            mainClass = mainFile.path.replace(/\.java$/, "").replace(/\//g, ".");
        } else if (filesToSend.length > 0) {
            mainClass = filesToSend[0].path.replace(/\.java$/, "").replace(/\//g, ".");
        }

        socketRef.current.send(
            JSON.stringify({
                type: "run",
                mainClass,
                files: filesToSend,
            })
        );
    }, []);

    return {
        output,
        isRunning,
        isConnected,
        runJavaCode,
        setOutput,
        setRunning
    };
};
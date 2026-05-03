"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import JavaEditor from "@/components/JavaEditor";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import ProjectExplorer, { FileNode } from "@/components/ProjectExplorer";
import OutputPanel from "@/components/OutputPanel";

const INITIAL_NODES: FileNode[] = [];

export default function Home() {
  const socketRef = useRef<WebSocket | null>(null);
  const [nodes, setNodes] = useState<FileNode[]>(INITIAL_NODES);
  const [selectedId, setSelectedId] = useState<string>("");
  const [output, setOutput] = useState<string>("The output will be shown here");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log("🔌 Connecting to WebSocket...");
      socket = new WebSocket("ws://localhost:8080");

      socket.onopen = () => {
        console.log("✅ Connected to WebSocket");
        socketRef.current = socket;
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "output" || msg.type === "error") {
          setOutput((prev) => prev + msg.data);
        }
        if (msg.type === "end") {
          setLoading(false);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket Error:", error);
      };

      socket.onclose = () => {
        console.log("🔌 WebSocket disconnected. Reconnecting in 3s...");
        socketRef.current = null;
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const findNode = useCallback((list: FileNode[], id: string): FileNode | null => {
    for (const node of list) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const currentFile = findNode(nodes, selectedId);

  const handleToggleFolder = (nodeId: string) => {
    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === nodeId) return { ...node, isOpen: !node.isOpen };
        if (node.children) return { ...node, children: updateNodes(node.children) };
        return node;
      });
    };
    setNodes(updateNodes(nodes));
  };

  const handleAddFile = (parentId: string, name: string) => {
    const className = name.replace(".java", "");
    const packageName = parentId === "workspace" ? "" : parentId.replace(/\//g, ".");
    
    let content = "";
    if (packageName) {
      content += `package ${packageName};\n\n`;
    }
    
    content += `public class ${className} {\n`;
    if (className === "Main") {
      content += `    public static void main(String[] args) {\n        System.out.println("Hello from ${packageName || "root"}!");\n    }\n`;
    }
    content += `}`;

    const newNode: FileNode = {
      id: parentId === "workspace" ? name : `${parentId}/${name}`,
      name,
      type: "file",
      content,
    };

    if (parentId === "workspace") {
      setNodes([...nodes, newNode]);
      return;
    }

    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === parentId) {
          return { ...node, isOpen: true, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };
    setNodes(updateNodes(nodes));
    setSelectedId(newNode.id);
  };

  const handleAddFolder = (parentId: string, name: string) => {
    const newNode: FileNode = {
      id: parentId === "workspace" ? name : `${parentId}/${name}`,
      name,
      type: "folder",
      isOpen: true,
      children: [],
    };

    if (parentId === "workspace") {
      setNodes([...nodes, newNode]);
      return;
    }

    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === parentId) {
          return { ...node, isOpen: true, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };
    setNodes(updateNodes(nodes));
  };

  const handleDelete = (nodeId: string) => {
    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list
        .filter((node) => node.id !== nodeId)
        .map((node) => {
          if (node.children) return { ...node, children: updateNodes(node.children) };
          return node;
        });
    };
    setNodes(updateNodes(nodes));
    if (selectedId === nodeId) setSelectedId("");
  };

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode === undefined) return;
    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === selectedId) return { ...node, content: newCode };
        if (node.children) return { ...node, children: updateNodes(node.children) };
        return node;
      });
    };
    setNodes(updateNodes(nodes));
  };

  const flattenFiles = (list: FileNode[], pathPrefix = ""): { path: string; content: string }[] => {
    let result: { path: string; content: string }[] = [];
    for (const node of list) {
      // Don't include the root folder itself in the path for the runner if it's just a container
      const currentPath = node.id === "root" ? "" : (pathPrefix ? `${pathPrefix}/${node.name}` : node.name);

      if (node.type === "file") {
        result.push({ path: currentPath, content: node.content || "" });
      } else if (node.children) {
        result = [...result, ...flattenFiles(node.children, currentPath)];
      }
    }
    return result;
  };

  const runCode = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("❌ WebSocket not connected");
      return;
    }

    setOutput("Output:\n");
    setLoading(true);

    const filesToSend = flattenFiles(nodes);

    // Get the directory of the currently selected file
    const currentFileNode = findNode(nodes, selectedId);
    const currentDirPath = selectedId.includes("/") 
      ? selectedId.split("/").slice(0, -1).join("/") 
      : "";

    // Prioritize Main.java in the current directory
    let mainFile = filesToSend.find(f => f.path === (currentDirPath ? `${currentDirPath}/Main.java` : "Main.java"));
    
    // Fallback: search for ANY Main.java in the project
    if (!mainFile) {
      mainFile = filesToSend.find(f => f.path.endsWith("Main.java"));
    }
    
    let mainClass = "Main";
    if (mainFile) {
      // Convert path to class name (e.g., "poly_1/Main.java" -> "poly_1.Main")
      mainClass = mainFile.path
        .replace(/\.java$/, "")
        .replace(/\//g, ".");
    } else if (filesToSend.length > 0) {
      mainClass = filesToSend[0].path
        .replace(/\.java$/, "")
        .replace(/\//g, ".");
    }

    socketRef.current.send(
      JSON.stringify({
        type: "run",
        mainClass,
        files: filesToSend,
      })
    );
  };

  const sendInput = (value: string) => {
    socketRef.current?.send(JSON.stringify({ type: "input", data: value }));
    setOutput((prev) => prev + value + "\n");
  };

  return (
    <main className="flex flex-row h-screen border border-orange-800">
      <ProjectExplorer
        nodes={nodes}
        selectedId={selectedId}
        onFileSelect={(node) => setSelectedId(node.id)}
        onToggleFolder={handleToggleFolder}
        onAddFile={handleAddFile}
        onAddFolder={handleAddFolder}
        onDelete={handleDelete}
      />

      <div className="flex flex-1 flex-col">
        <JavaEditor
          code={currentFile?.content || ""}
          fileName={currentFile?.name || "No file selected"}
          onCodeChange={handleCodeChange}
          onRun={runCode}
        />

        <OutputPanel
          output={output}
          onClear={() => setOutput("")}
        />

        <input
          placeholder="Type input and press Enter..."
          className="bg-black text-green-400 p-2 border-t border-gray-700 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendInput(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
      </div>

      <ScaffoldingPanel />
    </main>
  );
}


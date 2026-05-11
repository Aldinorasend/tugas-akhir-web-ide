"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import JavaEditor from "@/components/JavaEditor";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import ProjectExplorer, { FileNode } from "@/components/ProjectExplorer";
import OutputPanel from "@/components/OutputPanel";
import { supabase } from "@/lib/supabase";

const INITIAL_NODES: FileNode[] = [];

export default function StudentIDE() {
  const socketRef = useRef<WebSocket | null>(null);
  const [nodes, setNodes] = useState<FileNode[]>(INITIAL_NODES);
  const [selectedId, setSelectedId] = useState<string>("");
  const [output, setOutput] = useState<string>("The output will be shown here");
  const [loading, setLoading] = useState<boolean>(false);
  const [studyCase, setStudyCase] = useState<any>(null);
  const [loadingCase, setLoadingCase] = useState<boolean>(true);

  useEffect(() => {
    const loadCaseAndFiles = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (!id) {
        setLoadingCase(false);
        // Default template code when no id is given
        const defaultFile: FileNode = {
          id: "Main.java",
          name: "Main.java",
          type: "file",
          content: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Pathwise!");\n    }\n}`
        };
        setNodes([defaultFile]);
        setSelectedId("Main.java");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('study_cases')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setStudyCase(data);
          if (data.initial_code) {
            try {
              const projectNodes = typeof data.initial_code === "string"
                ? JSON.parse(data.initial_code)
                : data.initial_code;

              if (Array.isArray(projectNodes)) {
                setNodes(projectNodes);
                const findFirstFile = (list: FileNode[]): FileNode | null => {
                  for (const node of list) {
                    if (node.type === "file") return node;
                    if (node.children) {
                      const found = findFirstFile(node.children);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const firstFile = findFirstFile(projectNodes);
                if (firstFile) setSelectedId(firstFile.id);
              } else {
                throw new Error("Parsed JSON is not an array");
              }
            } catch (e) {
              const startingFile: FileNode = {
                id: "Main.java",
                name: "Main.java",
                type: "file",
                content: data.initial_code
              };
              setNodes([startingFile]);
              setSelectedId("Main.java");
            }
          } else {
            const defaultFile: FileNode = {
              id: "Main.java",
              name: "Main.java",
              type: "file",
              content: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Pathwise!");\n    }\n}`
            };
            setNodes([defaultFile]);
            setSelectedId("Main.java");
          }
        }
      } catch (err) {
        console.error("Failed to load study case:", err);
      } finally {
        setLoadingCase(false);
      }
    };

    loadCaseAndFiles();
  }, []);

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

  const handleRename = (nodeId: string, newName: string) => {
    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === nodeId) {
          const oldIdParts = node.id.split("/");
          oldIdParts[oldIdParts.length - 1] = newName;
          const newId = oldIdParts.join("/");
          
          let updatedNode = { ...node, id: newId, name: newName };
          
          if (node.type === "folder" && node.children) {
            const updateChildIds = (childrenList: FileNode[], parentPath: string): FileNode[] => {
              return childrenList.map((child) => {
                const childNewId = `${parentPath}/${child.name}`;
                if (child.type === "folder" && child.children) {
                  return {
                    ...child,
                    id: childNewId,
                    children: updateChildIds(child.children, childNewId)
                  };
                }
                return { ...child, id: childNewId };
              });
            };
            updatedNode.children = updateChildIds(node.children, newId);
          }
          
          return updatedNode;
        }
        
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };

    setNodes((prevNodes) => {
      const nextNodes = updateNodes(prevNodes);
      
      const nodeExists = (list: FileNode[], id: string): boolean => {
        for (const n of list) {
          if (n.id === id) return true;
          if (n.children && nodeExists(n.children, id)) return true;
        }
        return false;
      };
      
      if (selectedId && !nodeExists(nextNodes, selectedId)) {
        const findFirstFile = (tree: FileNode[]): FileNode | null => {
          for (const n of tree) {
            if (n.type === "file") return n;
            if (n.children) {
              const found = findFirstFile(n.children);
              if (found) return found;
            }
          }
          return null;
        };
        const f = findFirstFile(nextNodes);
        if (f) setSelectedId(f.id);
      }
      
      return nextNodes;
    });
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

    const currentFileNode = findNode(nodes, selectedId);
    const currentDirPath = selectedId.includes("/") 
      ? selectedId.split("/").slice(0, -1).join("/") 
      : "";

    let mainFile = filesToSend.find(f => f.path === (currentDirPath ? `${currentDirPath}/Main.java` : "Main.java"));
    
    if (!mainFile) {
      mainFile = filesToSend.find(f => f.path.endsWith("Main.java"));
    }
    
    let mainClass = "Main";
    if (mainFile) {
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

  if (loadingCase) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 gap-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Initializing your Coding Workspace...</p>
      </div>
    );
  }

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
        onRename={handleRename}
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

      <ScaffoldingPanel mode="code" />
    </main>
  );
}

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import JavaEditor from "@/components/JavaEditor";
import ProjectExplorer, { FileNode } from "@/components/ProjectExplorer";
import OutputPanel from "@/components/OutputPanel";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, Save, Sparkles, FolderCode, FileJson, CheckCircle2, CloudLightning } from "lucide-react";

export default function ProjectConfigPage() {
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [studyCase, setStudyCase] = useState<any>(null);
  const [mode, setMode] = useState<"new" | "edit">("new");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [output, setOutput] = useState<string>("The output will be shown here");
  const [running, setRunning] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

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

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log("🔌 Connecting to WebSocket from Lecturer Studio...");
      socket = new WebSocket("ws://localhost:8080");

      socket.onopen = () => {
        console.log("✅ Lecturer connected to WebSocket");
        socketRef.current = socket;
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "output" || msg.type === "error") {
          setOutput((prev) => prev + msg.data);
        }
        if (msg.type === "end") {
          setRunning(false);
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
      alert("Execution server is offline or connecting. Please wait a moment.");
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

  useEffect(() => {
    const initializeWorkspace = async () => {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const modeParam = params.get("mode");

      if (id) {
        setMode("edit");
        try {
          const { data, error } = await supabase
            .from("study_cases")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;

          if (data) {
            setStudyCase(data);
            if (data.initial_code) {
              try {
                const projectNodes = typeof data.initial_code === "string"
                  ? JSON.parse(data.initial_code)
                  : data.initial_code;
                setNodes(projectNodes);
                // Select first file if any
                const firstFile = findFirstFile(projectNodes);
                if (firstFile) setSelectedId(firstFile.id);
              } catch (e) {
                // fallback if single class text
                const startingFile: FileNode = {
                  id: "Main.java",
                  name: "Main.java",
                  type: "file",
                  content: data.initial_code,
                };
                setNodes([startingFile]);
                setSelectedId("Main.java");
              }
            } else {
              // Default files
              const defaultFiles: FileNode[] = [
                {
                  id: "Main.java",
                  name: "Main.java",
                  type: "file",
                  content: `public class Main {\n    public static void main(String[] args) {\n        // Enter student template code with bugs to solve...\n        System.out.println("Hello, Pathwise!");\n    }\n}`,
                },
              ];
              setNodes(defaultFiles);
              setSelectedId("Main.java");
            }
          }
        } catch (err) {
          console.error("Failed to load study case:", err);
          alert("Error loading study case configuration.");
        }
      } else {
        setMode("new");
        // Load from localStorage if present
        const saved = localStorage.getItem("pathwise_new_starter_code");
        if (saved) {
          try {
            const projectNodes = JSON.parse(saved);
            setNodes(projectNodes);
            const firstFile = findFirstFile(projectNodes);
            if (firstFile) setSelectedId(firstFile.id);
          } catch (e) {
            console.error("Failed to parse local storage starter code", e);
          }
        } else {
          // Default files for new
          const defaultFiles: FileNode[] = [
            {
              id: "Main.java",
              name: "Main.java",
              type: "file",
              content: `public class Main {\n    public static void main(String[] args) {\n        // Enter student template code with bugs to solve...\n        System.out.println("Hello, Pathwise!");\n    }\n}`,
            },
          ];
          setNodes(defaultFiles);
          setSelectedId("Main.java");
        }
      }
      setLoading(false);
    };

    initializeWorkspace();
  }, []);

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
      setSelectedId(newNode.id);
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

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    const jsonString = JSON.stringify(nodes);

    if (mode === "new") {
      localStorage.setItem("pathwise_new_starter_code", jsonString);
      setSaving(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      try {
        const { error } = await supabase
          .from("study_cases")
          .update({ initial_code: jsonString })
          .eq("id", id);

        if (error) throw error;
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (err) {
        console.error("Error saving starter code to Supabase:", err);
        setSaveStatus("error");
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 gap-4">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse text-orange-400">Loading Starter Project Configurer...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-screen   bg-[#0a0a0a] text-slate-300 ">
      {/* Premium Header */}
      <header className="h-16 px-6 bg-[#121212] border-b border-white/5 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-xl">
            <FolderCode className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-orange-500 bg-orange-500/5 border border-orange-500/10 px-2 py-0.5 rounded-md">
                Lecturer Studio
              </span>
              <span className="text-xs text-slate-500 font-bold">•</span>
              <span className="text-xs text-slate-400 font-semibold">
                {mode === "new" ? "New Case Sandbox" : `Editing: ${studyCase?.title}`}
              </span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-wide">
              Buggy Starter Project Configurer
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {saveStatus === "success" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Workspace synced successfully!</span>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-in fade-in zoom-in-95 duration-200">
              <CloudLightning className="w-4 h-4 animate-bounce" />
              <span>Failed to sync database!</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:from-slate-800 disabled:to-slate-800 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-orange-500/10 active:scale-95 duration-200 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Syncing..." : "Sync Starter Project"}</span>
          </button>

          <button
            onClick={() => window.close()}
            className="flex items-center gap-2 bg-[#1c1c1c] hover:bg-[#252525] border border-white/5 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
          >
            Close Configurer
          </button>
        </div>
      </header>

      {/* Editor & Explorer Body */}
      <div className="flex flex-1 overflow-hidden">
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

        <div className="flex flex-1 flex-col overflow-hidden bg-[#181818]">
          {currentFile ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <JavaEditor
                code={currentFile.content || ""}
                fileName={currentFile.name}
                onCodeChange={handleCodeChange}
                onRun={runCode}
              />
              <OutputPanel
                output={output}
                onClear={() => setOutput("")}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 border-l border-white/5 bg-[#141414]">
              <div className="p-4 bg-white/5 rounded-full border border-white/10">
                <Sparkles className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">Starter Code Sandbox</h3>
              <p className="text-xs max-w-sm text-center leading-relaxed text-slate-500">
                Create folders/packages and classes using the Explorer on the left, then click on files to configure their default starting buggy code structure.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

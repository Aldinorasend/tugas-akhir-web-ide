"use client";

import DiagramCanvas, { DiagramCanvasRef } from "@/components/diagram/DiagramCanvas";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Edit3, Info, ChevronRight, Save, Loader2, ArrowLeft, Code, Sparkles, Terminal } from "lucide-react";
import ProjectExplorer, { FileNode } from "@/components/ProjectExplorer";
import JavaEditor from "@/components/JavaEditor";
import OutputPanel from "@/components/OutputPanel";

export default function EditStudyCasePage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("inheritance");
  const [passThreshold, setPassThreshold] = useState(0.7);
  const diagramRef = useRef<DiagramCanvasRef>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"diagram" | "code">("diagram");

  // Multi-file Workspace States
  const [nodes, setNodes] = useState<FileNode[]>([
    {
      id: "Main.java",
      name: "Main.java",
      type: "file",
      content: `public class Main {\n    public static void main(String[] args) {\n        // Enter student template code with bugs to solve...\n        System.out.println("Hello, Pathwise!");\n    }\n}`,
    },
  ]);
  const [selectedId, setSelectedId] = useState<string>("Main.java");
  const [output, setOutput] = useState<string>("Execution output will be shown here...");
  const [running, setRunning] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Fetch Study Case
  useEffect(() => {
    const fetchStudyCase = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('study_cases')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setTitle(data.title);
          setDescription(data.description);
          setStatus(data.is_active);
          setCategory(data.category || "inheritance");
          setPassThreshold(data.pass_threshold !== undefined && data.pass_threshold !== null ? data.pass_threshold : 0.7);

          // Load starter code
          if (data.initial_code) {
            try {
              const parsedCode = typeof data.initial_code === "string" 
                ? JSON.parse(data.initial_code)
                : data.initial_code;
              
              if (Array.isArray(parsedCode)) {
                setNodes(parsedCode);
                if (parsedCode.length > 0) {
                  setSelectedId(parsedCode[0].id);
                }
              }
            } catch (err) {
              console.error("Failed to parse initial_code", err);
            }
          }

          // Wait a bit for the canvas to mount before setting diagram
          setTimeout(() => {
            if (diagramRef.current) {
              diagramRef.current.setDiagram(
                data.answer_key?.nodes || [],
                data.answer_key?.edges || []
              );
            }
          }, 500);
        }
      } catch (err: unknown) {
        alert("Error fetching study case: " + (err as Error).message);
        router.push("/lecturer");
      } finally {
        setLoading(false);
      }
    };

    fetchStudyCase();
  }, [id, router]);

  // WebSocket Connection
  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log("🔌 Connecting to WebSocket from Lecturer Studio (Edit)...");
      socket = new WebSocket("ws://localhost:8080");

      socket.onopen = () => {
        console.log("✅ Lecturer (Edit) connected to WebSocket");
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
        console.error("❌ WebSocket Error (Edit):", error);
      };

      socket.onclose = () => {
        console.log("🔌 WebSocket (Edit) disconnected. Reconnecting in 3s...");
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

  // Workspace File Handlers
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

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const snapshot = diagramRef.current?.getSnapshot();

      if (!snapshot || snapshot.nodes.length === 0) {
        setUpdating(false);
        return alert("Wait! Your diagram is empty.");
      }

      const initialCodeValue = JSON.stringify(nodes);

      const { error } = await supabase
        .from('study_cases')
        .update({
          title,
          description,
          category,
          answer_key: snapshot,
          is_active: status,
          pass_threshold: passThreshold,
          initial_code: initialCodeValue,
        })
        .eq('id', id);

      if (error) {
        alert("Error: " + error.message);
      } else {
        alert("Success! Study Case updated.");
        router.push("/lecturer");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading Study Case...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#020617] text-slate-300">
      {/* Left Panel: Study Case Editor */}
      <div className="w-96 h-full border-r border-slate-800 bg-[#0f172a] p-6 overflow-y-auto flex flex-col gap-8 shadow-2xl z-10 shrink-0">
        <div>
          <button
            onClick={() => router.push("/lecturer")}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4 text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Edit3 className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Edit Case</h1>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Update the scenario and answer key.</p>
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Case Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Animal Polymorphism"
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600 shadow-inner text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Category / OOP Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-slate-300 shadow-inner cursor-pointer"
            >
              <option value="inheritance">Inheritance</option>
              <option value="polymorphism">Polymorphism</option>
              <option value="encapsulation">Encapsulation</option>
              <option value="abstraction">Abstraction</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Description / Scenario
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scenario for students..."
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-slate-300 placeholder:text-slate-600 resize-none shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> UML Matching Threshold ({(passThreshold * 100).toFixed(0)}%)
            </label>
            <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700 rounded-xl p-3 shadow-inner">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={passThreshold}
                onChange={(e) => setPassThreshold(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs font-bold text-white shrink-0">{(passThreshold * 100).toFixed(0)}% Match</span>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex justify-between items-center">
              <label className=" text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Code className="w-4 h-4 text-orange-500" /> Buggy Starter Project
              </label>
              <span className="text-[7px] text-center p-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-extrabold rounded-full uppercase tracking-widest">
                Whole Project
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Design a complete project structure of buggy starter files and directories for students to solve in the IDE step.
            </p>

            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`w-full py-3 border font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all text-sm ${activeTab === "code"
                ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600 text-white"
                }`}
            >
              <Code className="w-4 h-4 text-orange-500" />
              <span>Configure Starter Files</span>
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-slate-300 placeholder:text-slate-600 shadow-inner"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="bg-blue-500/5 p-5 rounded-2xl border border-dashed border-blue-500/20 flex gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Changes will be saved as the <strong className="text-blue-400">Answer Key</strong> for this study case.
            </p>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={updating || !title || !description}
          className="w-full p-4 mt-auto rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white shadow-xl hover:shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0"
        >
          {updating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Update Study Case
            </>
          )}
        </button>
      </div>

      {/* Center Panel: Tabbed Workspace (Diagram vs Buggy Starter Code) */}
      <div className="flex-1 h-full flex flex-col bg-[#0c0c0c] overflow-hidden">
        {/* Premium Tab Selector Header */}
        <div className="h-14 bg-[#0f172a] border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("diagram")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === "diagram"
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
            >
              <span>UML Diagram (Answer Key)</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === "code"
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
            >
              <span>Buggy Starter Code</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded font-black">
                IDE
              </span>
            </button>
          </div>

          <div>
            {activeTab === "diagram" ? (
              <div className="bg-blue-500/10 text-blue-400 border border-blue-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Editing Answer Key
              </div>
            ) : (
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Configuring Starter Buggy Code
              </div>
            )}
          </div>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === "diagram" ? (
            <div className="w-full h-full relative">
              <DiagramCanvas ref={diagramRef} />
            </div>
          ) : (
            <div className="w-full h-full flex overflow-hidden">
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
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 bg-[#141414]">
                    <div className="p-4 bg-white/5 rounded-full border border-white/10">
                      <Sparkles className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-300">Starter Code Sandbox</h3>
                    <p className="text-xs max-w-sm text-center leading-relaxed text-slate-500 animate-pulse">
                      Create folders/packages and classes using the Explorer on the left, then click on files to configure their default starting buggy code structure.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

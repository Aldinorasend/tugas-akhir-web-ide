"use client";

import DiagramCanvas, { DiagramCanvasRef } from "@/components/diagram/DiagramCanvas";
import { createStudyCase } from "@/lib/api"

import { useRef, useState, useEffect, useCallback } from "react";
import { Rocket, Info, ChevronRight, ChevronDown, Save, Code, Sparkles, Terminal } from "lucide-react";
import ProjectExplorer, { FileNode } from "@/components/ProjectExplorer";
import JavaEditor from "@/components/JavaEditor";
import OutputPanel from "@/components/OutputPanel";
import { useSocket } from "@/hooks/useWebsocket";

export default function NewStudyCasePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("inheritance");
  const [passThreshold, setPassThreshold] = useState(0.7);
  const diagramRef = useRef<DiagramCanvasRef>(null);
  const [loading, setLoading] = useState(false);
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
  const { output, isRunning, runJavaCode } = useSocket();  // Multi-file Workspace States

  const handleRun = () => {
    // flattenFiles, nodes, dan selectedId biasanya ada di scope komponen/state
    runJavaCode(nodes, selectedId, flattenFiles);
  };

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


  const handlePublish = async () => {
    setLoading(true);
    try {

      const snapshot = diagramRef.current?.getSnapshot();

      if (!snapshot || snapshot.nodes.length === 0) {
        setLoading(false);
        return alert("Wait! Your diagram is empty.");
      }

      const initialCodeValue = JSON.stringify(nodes);

      // Convert UML diagram elements to Logic Rules (Facts & relationships of classes, methods, and attributes)
      const logicRulesResult = diagramRef.current?.getLogicRules();
      const logicRulesValue = logicRulesResult ? logicRulesResult.rules : [];

      const response = await createStudyCase({
        title,
        description,
        category,
        initial_code: initialCodeValue,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        logic_rules: logicRulesValue
      });
      if (response.status === "ok" || response.success) {
        alert("Success! Study Case and Answer Key are stored.");
        setTitle("");
        setDescription("");
        setPassThreshold(0.7);
        setNodes([
          {
            id: "Main.java",
            name: "Main.java",
            type: "file",
            content: `public class Main {\n    public static void main(String[] args) {\n        // Enter student template code with bugs to solve...\n        System.out.println("Hello, Pathwise!");\n    }\n}`,
          },
        ]);
        setSelectedId("Main.java");
      } else {
        alert("Publishing failed: " + (response.error || "Unknown server error."));
      }
    } catch (err: any) {
      console.error("Failed Publish Study Case", err);
      alert("Failed Publish Study Case: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#020617] text-slate-300">
      {/* Left Panel: Study Case Editor */}
      <div className="w-96 h-full border-r border-slate-800 bg-[#0f172a] p-6 overflow-y-auto flex flex-col gap-8 shadow-2xl z-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Create Case</h1>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Define the scenario and answer key.</p>
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

          <div className="bg-blue-500/5 p-5 rounded-2xl border border-dashed border-blue-500/20 flex gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              The diagram on the right will be saved as the <strong className="text-blue-400">Answer Key</strong> for this study case.
            </p>
          </div>
        </div>

        <button
          onClick={handlePublish}
          disabled={loading || !title || !description}
          className="w-full p-4 mt-auto rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white shadow-xl hover:shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Publish Study Case
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
                Designing Answer Key
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
          <div className={`w-full h-full relative ${activeTab === "diagram" ? "" : "hidden"}`}>
            <DiagramCanvas ref={diagramRef} />
          </div>

          <div className={`w-full h-full flex overflow-hidden ${activeTab === "code" ? "" : "hidden"}`}>
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
                    onRun={handleRun}
                  />
                  <OutputPanel
                    output={output}
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
        </div>
      </div>
    </div>
  );
}

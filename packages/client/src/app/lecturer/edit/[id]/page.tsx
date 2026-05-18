"use client";

import DiagramCanvas, { DiagramCanvasRef } from "@/components/diagram/DiagramCanvas";
import { supabase } from "@/lib/supabase";
import { getStudyCaseById, updateStudyCase } from "@/lib/api"

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Edit3, Info, ChevronRight, Save, Loader2, ArrowLeft, Code, Code2, Terminal, CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";
import ProjectExplorer, { FileNode } from "@/components/ProjectExplorer";
import JavaEditor from "@/components/JavaEditor";
import OutputPanel from "@/components/OutputPanel";
import { useSocket } from "@/hooks/useWebsocket";
import { useWorkspace } from "@/hooks/useWorkspace";
import { div } from "framer-motion/client";

export default function EditStudyCasePage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const diagramRef = useRef<DiagramCanvasRef>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"diagram" | "code">("diagram");
  const [initial_code, setInitialCode] = useState("");

  // Popup Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning";
    onClose?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "warning",
    onClose?: () => void
  ) => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      onClose,
    });
  };
  // Shared Workspace Hook
  const {
    nodes,
    setNodes,
    selectedId,
    setSelectedId,
    currentFile,
    handleToggleFolder,
    handleAddFile,
    handleAddFolder,
    handleDelete,
    handleRename,
    handleCodeChange,
    flattenFiles,
  } = useWorkspace();

  const { output, isRunning, runJavaCode } = useSocket();

  // Fetch Study Case
  useEffect(() => {
    const fetchStudyCase = async () => {
      setLoading(true);
      try {
        const response = await getStudyCaseById(id as string);
        console.log("Fetched study case response:", response);

        if (response && response.data) {
          setTitle(response.data.title || "");
          setDescription(response.data.description || "");

          if (response.data.initial_code) {
            try {
              const parsedCode = typeof response.data.initial_code === "string"
                ? JSON.parse(response.data.initial_code)
                : response.data.initial_code;

              if (Array.isArray(parsedCode)) {
                setNodes(parsedCode);

                // Recursively find the first actual file node to load in the JavaEditor
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

                const firstFile = findFirstFile(parsedCode);
                if (firstFile) {
                  setSelectedId(firstFile.id);
                } else if (parsedCode.length > 0) {
                  setSelectedId(parsedCode[0].id);
                }
              }

              if (typeof response.data.initial_code === "string") {
                setInitialCode(response.data.initial_code);
              } else {
                setInitialCode(JSON.stringify(response.data.initial_code));
              }
            } catch (err) {
              console.error("Failed to parse initial_code", err);
            }
          }

          // Wait a bit for the canvas to mount before setting diagram
          setTimeout(() => {
            if (diagramRef.current) {
              diagramRef.current.setDiagram(
                response.data.diagram_rules?.nodes || [],
                response.data.diagram_rules?.edges || []
              );
            }
          }, 500);
        }
      } catch (err: unknown) {
        showModal(
          "Error Fetching",
          "Error fetching study case: " + (err as Error).message,
          "error",
          () => router.push("/lecturer")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudyCase();
  }, [id, router, setNodes, setSelectedId]);

  const handleRun = () => {
    runJavaCode(nodes, selectedId, flattenFiles);
  };
  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const snapshot = diagramRef.current?.getSnapshot();

      if (!snapshot || snapshot.nodes.length === 0) {
        setUpdating(false);
        return showModal(
          "Diagram Empty",
          "Wait! Your diagram is empty.",
          "warning"
        );
      }

      const initialCodeValue = JSON.stringify(nodes);


      const response = await updateStudyCase(id as string, {
        title,
        description,
        initial_code: initialCodeValue,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
      });
      if (response.status === "ok" || response.success) {
        showModal(
          "Success",
          "Success! Study Case and Answer Key are updated.",
          "success",
          () => router.push("/lecturer")
        );
      } else {
        showModal(
          "Update Failed",
          "Updating failed: " + (response.error || "Unknown server error."),
          "error"
        );
      }
    } catch (err: any) {
      console.error("Failed Update Study Case", err);
      showModal(
        "Update Failed",
        "Failed Update Study Case: " + err.message,
        "error"
      );
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

        <div className="space-y-4 flex-1 ">
          <div>
            <label className=" text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
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
                  {/* <OutputPanel
                    output={output}
                  /> */}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 bg-[#141414]">
                  <div className="p-4 bg-white/5 rounded-full border border-white/10">
                    <Code2 className="w-8 h-8 text-slate-400" />
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

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setModal((prev) => ({ ...prev, isOpen: false }));
                if (modal.onClose) modal.onClose();
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center gap-4 mt-2">
              {modal.type === "success" && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              )}
              {modal.type === "error" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              )}
              {modal.type === "warning" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {modal.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed px-4">
                  {modal.message}
                </p>
              </div>

              <button
                onClick={() => {
                  setModal((prev) => ({ ...prev, isOpen: false }));
                  if (modal.onClose) modal.onClose();
                }}
                className={`mt-4 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                  modal.type === "success"
                    ? "bg-green-600 hover:bg-green-500 text-white shadow-green-600/10"
                    : modal.type === "error"
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/10"
                    : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/10"
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

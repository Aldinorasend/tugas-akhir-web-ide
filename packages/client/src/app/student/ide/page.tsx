"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import JavaEditor from "@/components/JavaEditor";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import ProjectExplorer, { FileNode } from "@/components/ProjectExplorer";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function StudentIDE() {
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
  } = useWorkspace([]);

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
  }, [setNodes, setSelectedId]);

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
        />
      </div>

      <ScaffoldingPanel mode="code" />
    </main>
  );
}

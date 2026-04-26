"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, FileCode, Folder, Plus, Trash2, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils"; // If available, else simple concat

interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  isOpen?: boolean;
}

const INITIAL_DATA: FileNode[] = [
  {
    id: "root",
    name: "my-java-project",
    type: "folder",
    isOpen: true,
    children: [
      {
        id: "src",
        name: "src",
        type: "folder",
        isOpen: true,
        children: [
          {
            id: "Main.java",
            name: "Main.java",
            type: "file",
            content: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello Pathwise!\");\n    }\n}",
          },
          {
            id: "utils",
            name: "utils",
            type: "folder",
            children: [
              {
                id: "Helper.java",
                name: "Helper.java",
                type: "file",
                content: "public class Helper {\n    public static void log(String msg) {\n        System.out.println(msg);\n    }\n}",
              },
            ],
          },
        ],
      },
      {
        id: "pom.xml",
        name: "pom.xml",
        type: "file",
        content: "<!-- Maven Config -->",
      },
    ],
  },
];

interface ProjectExplorerProps {
  onFileSelect: (content: string, fileName: string) => void;
}

export default function ProjectExplorer({ onFileSelect }: ProjectExplorerProps) {
  const [nodes, setNodes] = useState<FileNode[]>(INITIAL_DATA);
  const [selectedId, setSelectedId] = useState<string>("Main.java");

  const toggleFolder = (nodeId: string) => {
    const updateNodes = (list: FileNode[]): FileNode[] => {
      return list.map((node) => {
        if (node.id === nodeId) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };
    setNodes(updateNodes(nodes));
  };

  const renderTree = (list: FileNode[], depth = 0) => {
    return list.map((node) => (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(node.id);
            } else {
              setSelectedId(node.id);
              onFileSelect(node.content || "", node.name);
            }
          }}
          className={cn(
            "group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition-colors",
            selectedId === node.id ? "bg-orange-500/10 text-orange-400" : "text-slate-400 hover:bg-white/5",
            depth > 0 && "ml-4"
          )}
        >
          {node.type === "folder" ? (
            <>
              {node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Folder size={14} className="text-blue-400" />
            </>
          ) : (
            <>
              <span className="w-3.5" /> {/* alignment */}
              <FileCode size={14} className="text-orange-500" />
            </>
          )}
          <span className="flex-1 truncate">{node.name}</span>
        </div>
        {node.type === "folder" && node.isOpen && node.children && (
          <div className="flex flex-col">{renderTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="w-64 h-full bg-[#141414] border-r border-white/5 flex flex-col overflow-hidden">
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 bg-[#181818]">
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Explorer</span>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-white/5 rounded text-slate-400" title="New File">
            <Plus size={14} />
          </button>
          <button className="p-1 hover:bg-white/5 rounded text-slate-400" title="New Folder">
            <FolderPlus size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {renderTree(nodes)}
      </div>
    </div>
  );
}

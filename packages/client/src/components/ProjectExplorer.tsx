"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, FileCode, Folder, Plus, Trash2, FolderPlus, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  isOpen?: boolean;
}

interface ProjectExplorerProps {
  nodes: FileNode[];
  selectedId: string;
  onFileSelect: (node: FileNode) => void;
  onToggleFolder: (nodeId: string) => void;
  onAddFile: (parentId: string, name: string) => void;
  onAddFolder: (parentId: string, name: string) => void;
  onDelete?: (nodeId: string) => void;
  onRename?: (nodeId: string, newName: string) => void;
}

export default function ProjectExplorer({
  nodes,
  selectedId,
  onFileSelect,
  onToggleFolder,
  onAddFile,
  onAddFolder,
  onDelete,
  onRename,
}: ProjectExplorerProps) {
  const [creating, setCreating] = useState<{ parentId: string; type: "file" | "folder" } | null>(null);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !creating) return;

    if (creating.type === "file") {
      onAddFile(creating.parentId, newName);
    } else {
      onAddFolder(creating.parentId, newName);
    }

    setCreating(null);
    setNewName("");
  };

  const renderTree = (list: FileNode[], depth = 0) => {
    return list.map((node) => (
      <div key={node.id} className="flex flex-col">
        {renamingId === node.id ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (renameName.trim() && onRename) {
                onRename(node.id, renameName.trim());
              }
              setRenamingId(null);
              setRenameName("");
            }}
            className="flex items-center gap-2 px-3 py-1.5"
            style={{ paddingLeft: `${(depth + 1) * 12}px` }}
          >
            {node.type === "folder" ? (
              <Folder size={14} className="text-blue-400 shrink-0" />
            ) : (
              <FileCode size={14} className="text-orange-500 shrink-0" />
            )}
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onBlur={() => {
                if (renameName.trim() && onRename) {
                  onRename(node.id, renameName.trim());
                }
                setRenamingId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setRenamingId(null);
                }
              }}
              className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 flex-1 outline-none focus:border-orange-500"
              autoFocus
            />
          </form>
        ) : (
          <div
            onClick={() => {
              if (node.type === "folder") {
                onToggleFolder(node.id);
              } else {
                onFileSelect(node);
              }
            }}
            className={cn(
              "group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition-colors",
              selectedId === node.id ? "bg-orange-500/10 text-orange-400" : "text-slate-400 hover:bg-white/5",
            )}
            style={{ paddingLeft: `${(depth + 1) * 12}px` }}
          >
            {node.type === "folder" ? (
              <>
                {node.isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                <Folder size={14} className="text-blue-400 shrink-0" />
              </>
            ) : (
              <>
                <span className="w-3.5 shrink-0" />
                <FileCode size={14} className="text-orange-500 shrink-0" />
              </>
            )}
            <span className="flex-1 truncate">{node.name}</span>

            {node.type === "folder" && (
              <div className="hidden group-hover:flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreating({ parentId: node.id, type: "file" });
                  }}
                  className="p-0.5 hover:bg-white/10 rounded"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreating({ parentId: node.id, type: "folder" });
                  }}
                  className="p-0.5 hover:bg-white/10 rounded"
                >
                  <FolderPlus size={12} />
                </button>
              </div>
            )}

            {onRename && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingId(node.id);
                  setRenameName(node.name);
                }}
                className="hidden group-hover:block p-0.5 hover:text-orange-400 rounded mr-1"
                title="Rename"
              >
                <Edit2 size={12} />
              </button>
            )}

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.id);
                }}
                className="hidden group-hover:block p-0.5 hover:text-red-400 rounded"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}

        {creating?.parentId === node.id && (
          <form
            onSubmit={handleCreate}
            className="flex items-center gap-2 px-3 py-1.5 ml-4"
            style={{ paddingLeft: `${(depth + 2) * 12}px` }}
          >
            {creating.type === "folder" ? (
              <Folder size={14} className="text-blue-400" />
            ) : (
              <FileCode size={14} className="text-orange-500" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => {
                if (!newName) setCreating(null);
              }}
              className="bg-transparent border-none outline-none text-sm text-slate-200 flex-1 w-full"
              placeholder={creating.type === "file" ? "file.java" : "folder name"}
              autoFocus
            />
          </form>
        )}

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
          <button
            className="p-1 hover:bg-white/5 rounded text-slate-400"
            title="New File at Root"
            onClick={() => setCreating({ parentId: "workspace", type: "file" })}
          >
            <Plus size={14} />
          </button>
          <button
            className="p-1 hover:bg-white/5 rounded text-slate-400"
            title="New Folder at Root"
            onClick={() => setCreating({ parentId: "workspace", type: "folder" })}
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {renderTree(nodes)}

        {creating?.parentId === "workspace" && (
          <form
            onSubmit={handleCreate}
            className="flex items-center gap-2 px-3 py-1.5"
          >
            {creating.type === "folder" ? (
              <Folder size={14} className="text-blue-400" />
            ) : (
              <FileCode size={14} className="text-orange-500" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => {
                if (!newName) setCreating(null);
              }}
              className="bg-transparent border-none outline-none text-sm text-slate-200 flex-1 w-full"
              placeholder={creating.type === "file" ? "file.java" : "folder name"}
              autoFocus
            />
          </form>
        )}
      </div>
    </div>
  );
}

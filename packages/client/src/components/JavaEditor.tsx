"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { Play, FileCode, CheckCircle2 } from "lucide-react";
import { tr } from "framer-motion/client";
import { on } from "events";

interface JavaEditorProps {
  code: string;
  fileName: string;
  onCodeChange: (value: string | undefined) => void;
  onRun: () => void;
}

export default function JavaEditor({ code, fileName, onCodeChange, onRun }: JavaEditorProps) {
  return (
    <div className="flex flex-col h-1/3 flex-1 bg-[#1e1e1e]">
      {/* Editor Header */}
      <div className="bg-[#252526] h-12 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500/10 p-1.5 rounded-lg">
            <FileCode size={16} className="text-orange-500" />
          </div>
          <span className="text-sm font-medium text-slate-300">{fileName}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">
            <CheckCircle2 size={12} />
            <span>Synced</span>
          </div>
          <button
            className="group flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-5 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95"
            onClick={onRun}
          >
            <Play size={14} className="fill-current" />
            
            Run
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="java"
          theme="vs-dark"
          value={code}
          onChange={onCodeChange}
          options={{
            fontSize: 14,
            fontFamily: "var(--font-mono)",
            minimap: { enabled: false },
            automaticLayout: true,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            wordWrap: "on"
          }}
        />
      </div>
    </div>
  );
}

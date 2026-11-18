"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { FileCode } from "lucide-react";

interface JavaEditorProps {
  code: string;
  fileName: string;
  onCodeChange: (value: string | undefined) => void;
}

export default function JavaEditor({ code, fileName, onCodeChange }: JavaEditorProps) {
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
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="java"
          theme="vs-dark"
          path={fileName}
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
            wordWrap: "on",
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            }
          }}
        />
      </div>
    </div>
  );
}

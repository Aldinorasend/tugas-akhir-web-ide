"use client";

import React from "react";
import { Terminal, Trash2 } from "lucide-react";

type Props = {
  output: string;
  onClear?: () => void;
};

export default function OutputPanel({ output, onClear }: Props) {
  return (
    <div className="flex flex-col h-56 bg-[#0c0c0c] border-t border-white/5 overflow-hidden">
      {/* Clean Header */}
      <div className="flex items-center justify-between px-5 h-10 bg-[#111111] border-b border-white/5">
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px] tracking-widest uppercase">
          <Terminal size={12} className="text-orange-500" />
          <span>Execution Output</span>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-white/5 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
            title="Clear Console"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Terminal Area */}
      <div className="flex-1 overflow-auto p-5 custom-scrollbar">
        {output ? (
          <pre className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{output}</pre>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-700 font-mono text-xs italic opacity-30 select-none">
            Output will appear here after execution...
          </div>
        )}
      </div>


    </div>
  );
}


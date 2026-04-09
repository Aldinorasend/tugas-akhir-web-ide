"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import socket from "@/lib/socket";

export default function JavaEditor() {
  const [code, setCode] = useState<string>(`public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Pathwise!");\n    }\n}`);

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setCode(value);
      socket.emit("editor-update", value);
    }
  };

  const handleRun = () => {
    socket.emit("run-code", code);
  };

  return (
    <div className="flex flex-col h-full flex-1">
      <div className="bg-slate-800 p-2 flex items-center justify-between border-b border-slate-700">
        <span className="text-sm font-medium text-slate-300 ml-2">Main.java</span>
        <button
          onClick={handleRun}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-sm font-bold transition-colors"
        >
          Run Code
        </button>
      </div>
      <Editor
        height="100%"
        defaultLanguage="java"
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />
    </div>
  );
}

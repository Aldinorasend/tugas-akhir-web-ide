"use client";

import React, { useState } from "react";
import JavaEditor from "@/components/JavaEditor";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import Sidebar from "@/components/Sidebar";
import ProjectExplorer from "@/components/ProjectExplorer";

export default function Home() {
  const [currentCode, setCurrentCode] = useState<string>(
    `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Pathwise!");\n    }\n}`
  );
  const [currentFileName, setCurrentFileName] = useState<string>("Main.java");

  const handleFileSelect = (content: string, fileName: string) => {
    setCurrentCode(content);
    setCurrentFileName(fileName);
  };

  return (
    <main className="flex h-screen w-full bg-[#181818] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        <ProjectExplorer onFileSelect={handleFileSelect} />
        <JavaEditor 
          code={currentCode} 
          fileName={currentFileName}
          onCodeChange={(val) => setCurrentCode(val || "")}
        />
        <ScaffoldingPanel />
      </div>
    </main>
  );
}

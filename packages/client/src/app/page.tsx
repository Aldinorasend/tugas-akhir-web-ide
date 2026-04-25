"use client";

import React, { useEffect, useRef, useState } from "react";
import JavaEditor from "@/components/JavaEditor";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import Sidebar from "@/components/Sidebar";
import ProjectExplorer from "@/components/ProjectExplorer";
import OutputPanel from "@/components/OutputPanel";
import { div, output } from "framer-motion/client";


export default function Home() {
  const socketRef = useRef<WebSocket | null>(null);
useEffect(() => {
  const socket = new WebSocket("ws://localhost:8080");

  socket.onopen = () => {
    console.log("✅ Connected to WebSocket");
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "output") {
      setOutput((prev) => prev + msg.data);
    }

    if (msg.type === "error") {
      setOutput((prev) => prev + msg.data);
    }

    if (msg.type === "end") {
      setLoading(false);
    }
  };

  socketRef.current = socket;

  return () => {
    socket.close();
  };
  }, []);
      const [files, setFiles] = useState<Record<string, string>>({
        "Main.java": `public class Main {
        public static void main(String[] args) {
          Animal a = new Dog();
          a.sound();
        }
      }`,
        "Animal.java": `public class Animal {
        public void sound() {
          System.out.println("Animal sound");
        }
      }`,
        "Dog.java": `public class Dog extends Animal {
        public void sound() {
          System.out.println("Dog barks");
        }
      }`,
    });
    const [output, setOutput] = useState<string>("The output will be shown here");
      const [loading, setLoading] = useState<boolean>(false);


const [currentFileName, setCurrentFileName] = useState("Main.java");
const [currentCode, setCurrentCode] = useState(files["Main.java"]);
 const handleFileSelect = (fileName: string) => {
  setCurrentFileName(fileName);
  setCurrentCode(files[fileName]);
};
  const runCode = () => {
  const socket = socketRef.current;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("❌ WebSocket not connected");
    return;
  }

  setOutput("Running...\n");
  setLoading(true);

  const formattedFiles = Object.entries(files).map(
    ([path, content]) => ({
      path,
      content,
    })
  );

  socket.send(
    JSON.stringify({
      type: "run",
      mainClass: "Main",
      files: formattedFiles,
    })
  );
};
const sendInput = (value: string) => {
    socketRef.current?.send(
      JSON.stringify({
        type: "input",
        data: value,
      })
    );

    // show input in terminal
    setOutput((prev) => prev + value + "\n");
  };


  //     const { jobId } = await res.json();

  //   const interval = setInterval(async () => {
  //     const resultRes = await fetch(
  //       `http://localhost:3001/result/${jobId}`
  //     );
  //     const result = await resultRes.json();

  //     if (result.status !== "running") {
  //       setOutput(result.output || result.error);
  //       setLoading(false);
  //       clearInterval(interval);
  //     }
  //   }, 1000);
  // }

  return (
        <main className="flex flex-row h-screen border border-orange-800">
      
      <ProjectExplorer onFileSelect={handleFileSelect} />

      <div className="flex flex-1 flex-col">
        
        <JavaEditor
          code={currentCode}
          fileName={currentFileName}
          onCodeChange={(val) => {
            setCurrentCode(val || "");
            setFiles((prev) => ({
              ...prev,
              [currentFileName]: val || "",
            }));
          }}
          onRun={runCode}
        />

        <OutputPanel output={output} />

        <input
          placeholder="Type input and press Enter..."
          className="bg-black text-green-400 p-2 border-t border-gray-700 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendInput(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
      </div>

      <ScaffoldingPanel />
    </main>
  );
}

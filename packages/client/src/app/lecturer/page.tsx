"use client";

import DiagramCanvas from "@/components/diagram/DiagramCanvas";
import { useDiagram } from "@/hooks/useDiagram";
import { publishStudyCase } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useRef, useState } from "react";

export default function LecturerPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const diagramRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);


  const handlePublish = async () => {
    // 1. Reach into the canvas and grab the 'Photocopy'
    const snapshot = diagramRef.current?.getSnapshot();

    if (!snapshot || snapshot.nodes.length === 0) {
      return alert("Wait! Your diagram is empty.");
    }

    // 2. Send the Package to the Filing Cabinet (Supabase)
    const { error } = await supabase
      .from('study_cases')
      .insert([{
        title,
        description,
        answer_key: snapshot, // This will now have your nodes and edges!
      }]);

    if (error) alert("Error: " + error.message);
    else alert("Success! Study Case and Answer Key are stored.");
  };
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-300">
      {/* Left Panel: Study Case Editor */}
      <div className="w-96 h-full border-r border-slate-800 bg-[#0f172a] p-6 overflow-y-auto flex flex-col gap-8 shadow-2xl">
        <div>
          <h1 className="text-xl font-bold text-white mb-1 tracking-tight">Lecturer Portal</h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Create study cases and define answer keys.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Case Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Animal Polymorphism"
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Description / Scenario</label>
            <textarea
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scenario for students..."
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-slate-300 placeholder:text-slate-600 resize-none shadow-inner"
            />
          </div>

          <div className="bg-blue-500/5 p-5 rounded-2xl border border-dashed border-blue-500/20">
            <p className="text-slate-500 text-xs text-center leading-relaxed font-medium">
              The diagram on the right will be saved as the <strong className="text-blue-400">Answer Key</strong> for this study case.
            </p>
          </div>
        </div>

        <button
          onClick={handlePublish}
          disabled={loading || !title || !description}
          className="w-full p-3 mt-2 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white shadow-xl hover:shadow-blue-500/20"
        >
          {loading ? "Saving..." : "Publish Study Case"}
        </button>
      </div>

      {/* Center: Diagram Canvas (Answer Key Builder) */}
      <div className="flex-1 h-full relative">
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-orange-500/10 backdrop-blur-md text-orange-400 border border-orange-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl ring-1 ring-white/5">
            Answer Key Mode
          </div>
        </div>
        <DiagramCanvas ref={diagramRef} />
      </div>
    </main>
  );
}


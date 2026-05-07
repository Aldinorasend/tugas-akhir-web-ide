"use client";

import { useEffect, useState } from "react";
interface DiagramNode {
  id: string;
  data: {
    name: string;
    attributes?: any[];
    methods?: any[];
  };
}
export default function ScaffoldingPanel({ stage, answerKey, diagramRef }: any) {
  const [currentNodes, setCurrentNodes] = useState<DiagramNode[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Null guard for the ref
      if (diagramRef?.current) {
        const snapshot = diagramRef.current.getSnapshot();
        if (snapshot) setCurrentNodes(snapshot.nodes || []);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [diagramRef]);

  return (
    <div className="w-80 h-full border-l border-slate-800 bg-[#0f172a] p-6 shadow-2xl">
      {stage === 3 && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-orange-400 uppercase tracking-widest">Stage 3: Affective</h2>
          <p className="text-sm text-slate-400 italic">"Focus on one class at a time."</p>
        </div>
      )}

      {stage === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-2 text-blue-400">
            <span className="text-xl">🧠</span>
            <h2 className="text-xs font-black uppercase tracking-widest">Stage 2: Metacognitive Support</h2>
          </div>

          <div className="space-y-4">
            <section className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
              <h3 className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-tighter">Evaluation:</h3>
              <ul className="text-[13px] text-slate-400 space-y-3 leading-relaxed">
                {currentNodes.length === 0 ? (
                  <li>• "Mengapa Anda belum mulai menarik box Class? Apakah ada istilah dalam deskripsi yang membingungkan?"</li>
                ) : (
                  <>
                    <li>• "Anda sudah membuat {currentNodes.length} class. Apakah hubungan antar class tersebut sudah mencerminkan hirarki 'is-a' atau 'has-a'?"</li>
                    <li>• "Coba perhatikan Class <strong>{currentNodes[0]?.data.name}</strong>. Apakah ia memiliki tanggung jawab yang terlalu banyak atau terlalu sedikit?"</li>
                  </>
                )}
              </ul>
            </section>

            <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-tighter">Strategic Planning:</h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                "Jika Anda ingin mengimplementasikan Polymorphism, Class mana yang seharusnya menjadi Parent, dan metode apa yang harus di-override oleh Child?"
              </p>
            </section>
          </div>
        </div>
      )}

      {stage === 1 && (
        <div className="space-y-4">
          <h2 className="text-xs font-black text-green-400 uppercase tracking-widest">Stage 1: Cognitive</h2>
          <p className="text-sm text-slate-300 italic">"The skeleton is on the canvas. Define the members now."</p>
        </div>
      )}
    </div>
  );
}
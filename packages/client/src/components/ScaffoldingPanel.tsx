"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, Terminal, Code, Info } from "lucide-react";

interface DiagramNode {
  id: string;
  data: {
    name: string;
    attributes?: any[];
    methods?: any[];
  };
}

export default function ScaffoldingPanel({ stage, activeTab, answerKey, diagramRef, onClose }: any) {
  const [currentNodes, setCurrentNodes] = useState<DiagramNode[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (diagramRef?.current) {
        const snapshot = diagramRef.current.getSnapshot();
        if (snapshot) setCurrentNodes(snapshot.nodes || []);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [diagramRef]);

  return (
    <div className="w-80 h-full border-l border-slate-800 bg-[#0f172a] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header with Close Button */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Support Panel</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "diagram" ? (
          <div className="space-y-6">
            {stage === 3 && (
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3" /> Stage 3: Affective
                </h2>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-sm text-slate-300 italic leading-relaxed">
                    "Take a deep breath. Focus on one class at a time. Designing software is an iterative process."
                  </p>
                </div>
              </div>
            )}

            {stage === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> Stage 2: Metacognitive
                </h2>

                <div className="space-y-4">
                  <section className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 shadow-inner">
                    <h3 className="text-[10px] font-bold text-blue-300 mb-3 uppercase tracking-tighter opacity-70">Evaluation:</h3>
                    <ul className="text-[13px] text-slate-400 space-y-3 leading-relaxed">
                      {currentNodes.length === 0 ? (
                        <li className="flex gap-2">
                          <span className="text-blue-500">•</span>
                          <span>"Why haven't you started drawing Class boxes yet? Is there a term in the description that's confusing?"</span>
                        </li>
                      ) : (
                        <>
                          <li className="flex gap-2">
                            <span className="text-blue-500">•</span>
                            <span>"You've created {currentNodes.length} classes. Does the relationship between them reflect 'is-a' or 'has-a' hierarchy?"</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-blue-500">•</span>
                            <span>"Look at Class <strong>{currentNodes[0]?.data.name}</strong>. Does it have too many or too few responsibilities?"</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </section>

                  <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                    <h3 className="text-[10px] font-bold text-slate-300 mb-3 uppercase tracking-tighter opacity-70">Strategic Planning:</h3>
                    <p className="text-[13px] text-slate-400 leading-relaxed italic">
                      "If you want to implement Polymorphism, which Class should be the Parent, and what method should be overridden by the Child?"
                    </p>
                  </section>
                </div>
              </div>
            )}

            {stage === 1 && (
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                  <Code className="w-3 h-3" /> Stage 1: Cognitive
                </h2>
                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20">
                  <p className="text-sm text-slate-300 italic">"The skeleton is on the canvas. Focus on defining members (attributes and methods) now."</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 text-orange-400">
              <Code className="w-4 h-4" />
              <h2 className="text-[10px] font-black uppercase tracking-widest">Coding Phase Support</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                <h3 className="text-[10px] font-bold text-orange-300 mb-2 uppercase tracking-tighter">Implementation Hint:</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  "Ensure your Java class names and package structure exactly match your UML design. Remember to handle inheritance using the <code>extends</code> keyword."
                </p>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <h3 className="text-[10px] font-bold text-slate-300 mb-2 uppercase tracking-tighter">Debug Checklist:</h3>
                <ul className="text-[12px] text-slate-500 space-y-2">
                  <li className="flex gap-2"><span>1.</span> <span>Check for missing semicolons.</span></li>
                  <li className="flex gap-2"><span>2.</span> <span>Verify public/private access modifiers.</span></li>
                  <li className="flex gap-2"><span>3.</span> <span>Ensure Main method is correctly defined.</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { Lightbulb, MessageSquare, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import socket from "@/lib/socket";

export default function ScaffoldingPanel() {
  const [hint, setHint] = useState<string | null>(null);
  const [reflection, setReflection] = useState<string | null>(null);
  const [motivation, setMotivation] = useState<string | null>(null);

  useEffect(() => {
    socket.on("scaffold-hint", (msg) => setHint(msg));
    socket.on("scaffold-reflection", (msg) => setReflection(msg));
    socket.on("scaffold-motivation", (msg) => {
      setMotivation(msg);
      setTimeout(() => setMotivation(null), 5000); // Auto hide motivation
    });

    return () => {
      socket.off("scaffold-hint");
      socket.off("scaffold-reflection");
      socket.off("scaffold-motivation");
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 h-full bg-slate-900 text-white border-l border-slate-700 w-80 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Flame className="text-orange-500" /> Pathwise Support
      </h2>

      {/* L1: Hint */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-yellow-400 mb-2">
          <Lightbulb size={18} /> Hint (L1)
        </h3>
        <p className="text-sm text-slate-300 italic">
          {hint || "No hints available yet. Keep coding!"}
        </p>
      </div>

      {/* L2: Reflection */}
      <AnimatePresence>
        {reflection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-indigo-900/40 p-4 rounded-xl border border-indigo-500/50 shadow-indigo-500/20 shadow-xl"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-300 mb-2">
              <MessageSquare size={18} /> Reflection (L2)
            </h3>
            <p className="text-sm mb-3">{reflection}</p>
            <button
              onClick={() => setReflection(null)}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 py-1 px-3 rounded-full transition-colors"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* L3: Motivation (Floating Toast in Scaffolding Panel context) */}
      <AnimatePresence>
        {motivation && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="mt-auto bg-green-900/40 p-4 rounded-xl border border-green-500/50 flex items-center gap-3"
          >
            <Flame className="text-green-400 stroke-[3px]" />
            <p className="text-sm font-medium">{motivation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

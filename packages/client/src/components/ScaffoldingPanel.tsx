"use client";

import React from "react";
import { Lightbulb, MessageSquare, Flame, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function ScaffoldingPanel() {
  return (
    <div className="flex flex-col gap-6 p-6 h-full bg-[#0f1117] text-white border-l border-white/5 w-[380px] overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-900/40">
            <Flame size={20} className="fill-white" />
          </div>
          Pathwise <span className="text-orange-500 italic font-medium">AI</span>
        </h2>
        <div className="bg-white/5 h-8 w-8 rounded-full flex items-center justify-center border border-white/10">
          <Sparkles size={14} className="text-yellow-400" />
        </div>
      </div>

      <div className="space-y-6">
        {/* L1: Hint (Glassmorphism) */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#1a1c23]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 text-yellow-500 mb-3">
              <Lightbulb size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">L1 • Smart Hint</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium capitalize">
              Coba gunakan <code className="bg-white/5 px-1.5 py-0.5 rounded text-orange-400">Scanner(System.in)</code> untuk menerima input dari pengguna. Pastikan import di baris pertama!
            </p>
          </div>
        </section>

        {/* L2: Reflection */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-[#1a1c23]/80 backdrop-blur-xl p-5 rounded-2xl border border-indigo-500/20 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-indigo-400 mb-3">
              <MessageSquare size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">L2 • Reflection</h3>
            </div>
            <p className="text-sm text-slate-300 mb-4 font-medium italic">
              "Apa yang terjadi jika variabel <code className="text-indigo-400 font-mono">count</code> bernilai negatif?"
            </p>
            <div className="flex flex-col gap-2">
              <input 
                type="text" 
                placeholder="Tulis pemikiranmu..." 
                className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 transition-all"
              />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1.5 rounded-lg transition-all active:scale-95 uppercase tracking-wider">
                Submit Reflection
              </button>
            </div>
          </motion.div>
        </section>

        {/* L3: Motivation */}
        <section className="relative">
          <div className="bg-green-500/5 backdrop-blur-md p-5 rounded-2xl border border-green-500/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp size={18} />
                <h3 className="text-xs font-black uppercase tracking-widest">L3 • Momentum</h3>
              </div>
              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">+12 XP</span>
            </div>
            <p className="text-sm font-semibold tracking-wide text-slate-200">
              Kamu sudah coding selama 15 menit tanpa henti. Fokusmu luar biasa! Teruskan 🔥
            </p>
          </div>
        </section>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between opacity-50 text-[10px] font-bold uppercase tracking-widest">
        <span>Session: Java Basics</span>
        <span>ID: PATH-882</span>
      </div>
    </div>
  );
}

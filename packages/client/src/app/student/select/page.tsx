"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HelpCircle, Sparkles, ArrowLeft, ArrowRight, BookOpen, Layers } from "lucide-react";

export default function StudentRouteSelection() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background lines */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          Pilih Mode Pembelajaran
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Silakan pilih mode pengerjaan di bawah ini untuk memulai sesi diagram UML dan pemrograman Java.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Route 1: Adaptive Scaffolding (Experimental Group) */}
        <motion.div
          whileHover={{ scale: 1.01, translateY: -2 }}
          whileTap={{ scale: 0.99 }}
          className="group"
        >
          <Link href="/student">
            <div className="h-full p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-900/90 shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="bg-blue-500/10 p-3 rounded-xl w-fit mb-5 text-blue-400">
                  <Layers size={24} />
                </div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  Adaptive Scaffolding
                </h2>
                <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded mb-4">
                  Kelompok Eksperimen
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Belajar dengan bantuan dukungan scaffolding adaptif yang memandu secara interaktif (Stage 1-3) berdasarkan deteksi kategori pengerjaan Anda.
                </p>
              </div>
              
              <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                Pilih Mode Ini <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Route 2: Non-Scaffolding (Control Group) */}
        <motion.div
          whileHover={{ scale: 1.01, translateY: -2 }}
          whileTap={{ scale: 0.99 }}
          className="group"
        >
          <Link href="/student/non-scaffolding">
            <div className="h-full p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 hover:bg-slate-900/90 shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="bg-slate-800 p-3 rounded-xl w-fit mb-5 text-slate-400">
                  <BookOpen size={24} />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  Non-Scaffolding
                </h2>
                <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 px-2 py-0.5 rounded mb-4">
                  Kelompok Kontrol
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Belajar secara mandiri hanya dengan menggunakan bantuan petunjuk umum dan dokumentasi konvensional statis (tanpa panduan bertahap adaptif).
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Pilih Mode Ini <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      <div className="mt-12 text-slate-600 text-[10px] text-center max-w-sm">
        Pilihan ini disediakan untuk keperluan evaluasi A/B testing guna mengukur pengaruh efektivitas scaffolding adaptif.
      </div>
    </div>
  );
}

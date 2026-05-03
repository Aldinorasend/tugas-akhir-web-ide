"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, ShieldCheck, ArrowRight, Code, Map } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20">
            <Map className="text-white" size={32} />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Pathwise
          </h1>
        </div>
        <p className="text-slate-400 text-lg max-w-lg mx-auto">
          The interactive Java learning platform that maps your journey from <span className="text-blue-400 font-semibold">Diagram</span> to <span className="text-blue-400 font-semibold">Code</span>.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Student Portal Card */}
        <motion.div
          whileHover={{ scale: 1.02, translateY: -5 }}
          whileTap={{ scale: 0.98 }}
          className="group"
        >
          <Link href="/student">
            <div className="h-full p-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl transition-all group-hover:border-blue-500/50 group-hover:bg-slate-800/80 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Code size={120} />
              </div>
              
              <div className="bg-blue-500/10 p-4 rounded-2xl w-fit mb-6 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <User size={32} />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Student Portal</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Analyze study cases, build UML class diagrams, and implement your solution in our Java IDE.
              </p>
              
              <div className="flex items-center gap-2 text-blue-400 font-bold group-hover:gap-4 transition-all">
                Start Learning <ArrowRight size={20} />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Lecturer Portal Card */}
        <motion.div
          whileHover={{ scale: 1.02, translateY: -5 }}
          whileTap={{ scale: 0.98 }}
          className="group"
        >
          <Link href="/lecturer">
            <div className="h-full p-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl transition-all group-hover:border-orange-500/50 group-hover:bg-slate-800/80 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck size={120} />
              </div>

              <div className="bg-orange-500/10 p-4 rounded-2xl w-fit mb-6 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <ShieldCheck size={32} />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Lecturer Portal</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Create new study cases, define reference class diagrams, and manage the curriculum.
              </p>
              
              <div className="flex items-center gap-2 text-orange-400 font-bold group-hover:gap-4 transition-all">
                Manage Cases <ArrowRight size={20} />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-20 text-slate-500 text-sm flex gap-6"
      >
        <span>&copy; 2026 Pathwise Educational IDE</span>
        <span className="text-slate-700">|</span>
        <a href="#" className="hover:text-white transition-colors">Documentation</a>
        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
      </motion.div>
    </div>
  );
}



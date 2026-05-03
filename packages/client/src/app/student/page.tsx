"use client";

import DiagramCanvas from "@/components/diagram/DiagramCanvas";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";

export default function StudentDiagramPage() {
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-300">
      {/* Left Panel: Study Case */}
      <div className="w-80 h-full border-r border-slate-800 bg-[#0f172a] p-6 overflow-y-auto flex flex-col shadow-2xl">
        <h1 className="text-xl font-bold text-white mb-4 tracking-tight">Studi Kasus: Polimorfisme Hewan</h1>
        <div className="prose prose-invert prose-sm text-slate-400 space-y-4">
          <p>
            Buatlah sebuah sistem sederhana untuk mensimulasikan suara berbagai jenis hewan.
          </p>
          <ol className="list-decimal list-inside space-y-2 marker:text-blue-500 marker:font-bold">
            <li>Buat superclass <code className="text-blue-400">Hewan</code> yang memiliki atribut <code>nama</code> dan method <code>bersuara()</code>.</li>
            <li>Buat dua subclass: <code className="text-blue-400">Kucing</code> dan <code className="text-blue-400">Anjing</code> yang meng-override method <code>bersuara()</code>.</li>
            <li>Gunakan modifier yang tepat untuk enkapsulasi (private untuk atribut).</li>
            <li>Gunakan hubungan <strong>Extends</strong> dari Kucing/Anjing ke Hewan.</li>
          </ol>
          <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20 mt-6 shadow-inner">
            <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
              <span>💡</span> Smart Tips
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Gunakan tombol <strong className="text-white">"Add Class"</strong> di atas untuk menambah kelas baru. Gunakan icon panah orange untuk hubungan <strong>Extends</strong>.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800 flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
           Live Project Mode
        </div>
      </div>

      {/* Center: Diagram Canvas */}
      <div className="flex-1 h-full relative">
        <DiagramCanvas />
      </div>

      {/* Right Panel: Scaffolding */}
      <ScaffoldingPanel mode="diagram" />
    </main>
  );
}


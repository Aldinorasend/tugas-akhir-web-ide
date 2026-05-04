"use client";

import DiagramCanvas from "@/components/diagram/DiagramCanvas";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import { getRandomStudyCase, getStudyCaseById } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { gradeDiagram } from "@/lib/grader";
import { supabase } from "@/lib/supabase";

export default function StudentDiagramPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const diagramRef = useRef<any>(null); // Ref to the canvas
  const [studyCase, setStudyCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nim, setNim] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const handleSubmit = async () => {
    const studentData = diagramRef.current?.getSnapshot();
    if (!studentData) return;

    setIsSubmitting(true);

    // 1. Run comparison
    const score = gradeDiagram(studyCase.answer_key, studentData);
    const threshold = studyCase.pass_threshold || 0.7; // e.g., 0.7
    const passed = score >= threshold;
    const displayScore = Math.round(score * 100); // e.g., 85%


    // 2. Save to 'submissions' table
    const { error } = await supabase
      .from('submissions')
      .insert([{
        study_case_id: studyCase.id,
        content: studentData, // Store their actual diagram JSON
        score: score,
        student_id: nim,
        passed: passed,
        nim: nim // You can get this from a prompt or auth
      }]);

    setIsSubmitting(false);

    if (error) {
      alert("Failed to submit: " + error.message);
    } else {
      alert(`Submitted! Your score: ${(score * 100).toFixed(0)}% - ${passed ? 'PASSED' : 'FAILED'}`);
    }
  };
  const loadCase = async () => {
    setLoading(true)
    try {
      const id = searchParams.get("id");

      if (id) {
        // If we have an ID in the URL, fetch that specific one
        const data = await getStudyCaseById(id);
        setStudyCase(data);
      } else {
        // If no ID, fetch random and update URL so it persists on refresh
        const data = await getRandomStudyCase();
        if (data) {
          setStudyCase(data);
          // Update URL without a full page reload
          const newPath = `${window.location.pathname}?id=${data.id}`;
          window.history.pushState({ path: newPath }, '', newPath);
        }
      }
    } catch (err) {
      console.error("Failed to load case", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
  }, [searchParams]);

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400 gap-4">
      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Preparing your challenge...</p>
    </div>
  );

  if (!studyCase) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] text-slate-400">
      <p>No active study cases found.</p>
    </div>
  );

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-300">
      {/* Left Panel: Study Case */}
      <div className="w-86 h-full border-r border-slate-800 bg-[#0f172a] p-6 overflow-y-auto flex flex-col shadow-2xl">
        <div className="flex flex-col mb-4">
          <h1 className="text-lg font-bold text-white tracking-tight">Study Case Title :</h1>
          <p className=" text-slate-200 group-hover:text-white font-bold text-md">
            {studyCase.title || 'Untitled'}
          </p>
        </div>
        <div className="prose prose-invert prose-sm text-slate-400 space-y-4">
          <p>
            <span className="text-slate-400"> {studyCase.description}</span>
          </p>

          <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20 mt-6 shadow-inner">
            <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
              <span>💡</span> Smart Tips
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Gunakan tombol <strong className="text-white">"Add Class"</strong> di atas untuk menambah kelas baru. Gunakan icon panah orange untuk hubungan <strong>Extends</strong>.
            </p>
          </div>
          <input type="text" value={nim} onChange={(e) => setNim(e.target.value)} placeholder="NIM" className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-8 w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/20"
        >
          {isSubmitting ? "Grading..." : "Submit Answer"}
        </button>

      </div>

      {/* Center: Diagram Canvas */}
      <div className="flex-1 h-full relative">
        <DiagramCanvas ref={diagramRef} />
      </div>

      {/* Right Panel: Scaffolding */}
      <ScaffoldingPanel mode="diagram" />
    </main>
  );
}


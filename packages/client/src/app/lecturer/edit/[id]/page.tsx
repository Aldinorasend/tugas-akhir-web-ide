"use client";

import DiagramCanvas, { DiagramCanvasRef } from "@/components/diagram/DiagramCanvas";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Edit3, Info, ChevronRight, Save, Loader2, ArrowLeft } from "lucide-react";

export default function EditStudyCasePage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("inheritance");
  const diagramRef = useRef<DiagramCanvasRef>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchStudyCase = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('study_cases')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setTitle(data.title);
          setDescription(data.description);
          setStatus(data.is_active);
          setCategory(data.category || "inheritance");
          // Wait a bit for the canvas to mount before setting diagram
          setTimeout(() => {
            if (diagramRef.current) {
              diagramRef.current.setDiagram(
                data.answer_key?.nodes || [],
                data.answer_key?.edges || []
              );
            }
          }, 500);
        }
      } catch (err: unknown) {
        alert("Error fetching study case: " + (err as Error).message);
        router.push("/lecturer");
      } finally {
        setLoading(false);
      }
    };

    fetchStudyCase();
  }, [id, router]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const snapshot = diagramRef.current?.getSnapshot();

      if (!snapshot || snapshot.nodes.length === 0) {
        setUpdating(false);
        return alert("Wait! Your diagram is empty.");
      }

      const { error } = await supabase
        .from('study_cases')
        .update({
          title,
          description,
          category,
          answer_key: snapshot,
          is_active: status,
        })
        .eq('id', id);

      if (error) {
        alert("Error: " + error.message);
      } else {
        alert("Success! Study Case updated.");
        router.push("/lecturer");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#020617] text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Study Case...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#020617] text-slate-300">
      {/* Left Panel: Study Case Editor */}
      <div className="w-96 h-full border-r border-slate-800 bg-[#0f172a] p-6 overflow-y-auto flex flex-col gap-8 shadow-2xl z-10">
        <div>
          <button
            onClick={() => router.push("/lecturer")}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4 text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Edit3 className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">Edit Case</h1>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Update the scenario and answer key.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Case Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Animal Polymorphism"
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Description / Scenario
            </label>
            <textarea
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scenario for students..."
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-slate-300 placeholder:text-slate-600 resize-none shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Category / OOP Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-slate-300 shadow-inner cursor-pointer"
            >
              <option value="inheritance">Inheritance</option>
              <option value="polymorphism">Polymorphism</option>
              <option value="encapsulation">Encapsulation</option>
              <option value="abstraction">Abstraction</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm text-slate-300 placeholder:text-slate-600 resize-none shadow-inner"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="bg-blue-500/5 p-5 rounded-2xl border border-dashed border-blue-500/20 flex gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Changes will be saved as the <strong className="text-blue-400">Answer Key</strong> for this study case.
            </p>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={updating || !title || !description}
          className="w-full p-4 mt-auto rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white shadow-xl hover:shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          {updating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Update Study Case
            </>
          )}
        </button>
      </div>

      {/* Center: Diagram Canvas (Answer Key Builder) */}
      <div className="flex-1 h-full relative">
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-orange-500/10 backdrop-blur-md text-orange-400 border border-orange-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl ring-1 ring-white/5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Edit Mode
          </div>
        </div>
        <DiagramCanvas ref={diagramRef} />
      </div>
    </div>
  );
}

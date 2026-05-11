"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StudyCase } from "@/app/types/uml";
import { BookOpen, Search, Filter, Calendar, Eye, Trash2, Layout, FileText, ChevronRight, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import DiagramPreview from "@/components/diagram/DiagramPreview";

export default function StudyCaseListPage() {
  const [cases, setCases] = useState<StudyCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<StudyCase | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setCases((data as StudyCase[]) || []);
      setLoading(false);
    };

    fetchCases();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this study case?")) return;

    const { error } = await supabase
      .from('study_cases')
      .delete()
      .eq('id', id);

    if (error) alert("Error deleting: " + error.message);
    else {
      setCases(cases.filter(c => c.id !== id));
      if (selectedCase?.id === id) setSelectedCase(null);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/lecturer/edit/${id}`);
  };

  return (
    <div className="flex h-full w-full bg-[#020617] overflow-hidden">
      {/* Master List */}
      <div className="w-[450px] h-full border-r border-slate-800 flex flex-col bg-[#0f172a]/30">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-[#0f172a]/50 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Layout className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Study Cases</h1>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-6">Manage your published materials</p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <button className="p-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-4 p-8 text-center">
              <FileText className="w-12 h-12 opacity-10" />
              <p className="text-sm">No study cases found. Create your first one!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={cn(
                    "group p-5 cursor-pointer transition-all border-l-4",
                    selectedCase?.id === c.id
                      ? "bg-blue-500/10 border-blue-500"
                      : "border-transparent hover:bg-slate-800/30 hover:border-slate-700"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={cn(
                      "font-bold transition-colors line-clamp-1",
                      selectedCase?.id === c.id ? "text-blue-400" : "text-slate-200 group-hover:text-white"
                    )}>
                      {c.title}
                    </h3>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0 ml-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tighter outline-2  ${c.is_active ? "outline-green-900 text-green-300" : "outline-red-500 text-red-500"}`}>{c.is_active ? "Active" : "Inactive"}</span>
                      {c.category && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] font-bold uppercase tracking-tighter">
                          {c.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEdit(c.id, e)}
                        className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(c.id, e)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="flex-1 h-full bg-[#020617] relative flex flex-col overflow-hidden">
        {selectedCase ? (
          <>
            <div className="p-10 border-b border-slate-800 bg-[#0f172a]/20 backdrop-blur-sm z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Study Case Detail
                    </span>
                    {selectedCase.category && (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {selectedCase.category}
                      </span>
                    )}
                    <span className="text-slate-600 text-xs font-medium">
                      Created on {new Date(selectedCase.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold text-white tracking-tight mb-4">{selectedCase.title}</h2>
                  <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{selectedCase.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                Answer Key Visualized Below
              </div>
            </div>

            <div className="flex-1 relative">
              <DiagramPreview
                nodes={selectedCase.answer_key?.nodes || []}
                edges={selectedCase.answer_key?.edges || []}
              />

              {/* Overlay Gradient to blend with header */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#020617] to-transparent pointer-events-none" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-6 p-20 text-center animate-in fade-in duration-700">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-blue-500/5 border border-blue-500/10 flex items-center justify-center animate-pulse">
                <BookOpen className="w-16 h-16 opacity-10" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-2xl">
                <Eye className="w-5 h-5 text-slate-500" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">Select a Case</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Select a study case from the list on the left to preview its description and answer key diagram.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

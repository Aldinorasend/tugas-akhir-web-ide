"use client";

import { useEffect, useState } from "react";
import { getAllStudyCases, deleteStudyCase } from "@/lib/api";
import { StudyCase } from "@/app/types/uml";
import { Search, Filter, Calendar, FileText, ChevronRight, Edit3, Trash2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import DiagramPreview from "@/components/diagram/DiagramPreview";

export default function StudyCaseListPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<StudyCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchCases = async () => {
    try {
      setLoading(true);
      const result = await getAllStudyCases();
      setCases(result.data || []);
    } catch (error) {
      console.error("Error Fetching Study Cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus study case ini?")) return;

    try {
      const response = await deleteStudyCase(id);
      if (response.status === "ok") {
        setCases(cases.filter((c) => c.id !== id));
        if (selectedCase?.id === id) setSelectedCase(null);
      } else {
        alert("Gagal menghapus: " + (response.error || "Kesalahan server tidak diketahui"));
      }
    } catch (err: any) {
      console.error("Error deleting study case:", err);
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/lecturer/edit/${id}`);
  };

  const filteredCases = cases.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query) ||
      c.category?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-full w-full bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      {/* Master List */}
      <div className="w-[400px] h-full border-r border-slate-800 flex flex-col bg-slate-900/40">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="mb-4">
            <h1 className="text-lg font-bold text-white">Study Cases</h1>
            <p className="text-slate-500 text-xs mt-0.5">Kelola bahan ajar mahasiswa</p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari study case..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-md py-1.5 pl-9 pr-4 text-xs text-slate-200 outline-none focus:border-slate-700 placeholder:text-slate-650"
              />
            </div>
            <button className="p-2 bg-slate-800 border border-slate-800 rounded-md text-slate-400 hover:text-white transition-colors">
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
              <p className="text-slate-500 text-xs">Memuat data...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-2 p-6 text-center">
              <FileText className="w-10 h-10 opacity-30" />
              <p className="text-xs">Tidak ada study case ditemukan</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-850">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors border-l-2",
                    selectedCase?.id === c.id
                      ? "bg-slate-800/50 border-blue-500 text-white"
                      : "border-transparent hover:bg-slate-800/20 text-slate-300"
                  )}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {c.title}
                    </h3>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0 ml-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 items-center">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${c.is_active ? "bg-emerald-950/20 border-emerald-900 text-emerald-400" : "bg-red-950/20 border-red-900 text-red-400"}`}>
                        {c.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                      {c.category && (
                        <span className="px-1.5 py-0.5 bg-slate-850 border border-slate-800 text-slate-400 rounded text-[9px] font-semibold">
                          {c.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleEdit(c.id, e)}
                        className="p-1 text-slate-500 hover:text-slate-350 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(c.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-450 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-650 ml-1 self-center" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="flex-1 h-full bg-[#0a0f1d] flex flex-col overflow-hidden">
        {selectedCase ? (
          <>
            <div className="p-6 border-b border-slate-800 bg-slate-900/20">
              <div className="max-w-4xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[9px] font-semibold">
                    Detail Study Case
                  </span>
                  {selectedCase.category && (
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[9px] font-semibold">
                      {selectedCase.category}
                    </span>
                  )}
                  <span className="text-slate-550 text-xs ml-2">
                    Dibuat pada {new Date(selectedCase.created_at).toLocaleDateString(undefined, { dateStyle: "long" })}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">{selectedCase.title}</h2>
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-md max-h-32 overflow-y-auto">
                  <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">{selectedCase.description}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 relative bg-[#070c18]">
              <DiagramPreview
                nodes={selectedCase.diagram_rules.nodes || []}
                edges={selectedCase.diagram_rules?.edges || []}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center">
              <BookOpen className="w-8 h-8 opacity-25" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-400 mb-1">Pilih Study Case</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Silakan pilih salah satu study case di panel kiri untuk melihat deskripsi lengkap dan kunci jawaban diagram.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

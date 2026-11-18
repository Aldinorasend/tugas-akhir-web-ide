"use client";

import { useEffect, useState } from "react";
import { getAllStudyCases, deleteStudyCase } from "@/lib/api";
import { StudyCase } from "@/app/types/uml";
import { Search, Calendar, FileText, Edit3, Trash2, BookOpen, Plus, X, Layers, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import DiagramPreview from "@/components/diagram/DiagramPreview";

export default function StudyCaseListPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<StudyCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "confirmation";
    onClose?: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "confirmation",
    onClose?: () => void,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      onClose: type !== "confirmation" ? onClose : undefined,
      onConfirm: type === "confirmation" ? onClose : onConfirm,
      onCancel,
    });
  };
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
    showModal("Hapus study case", "Apakah Anda yakin ingin menghapus study case ini?", "confirmation", async () => {
      try {
        const response = await deleteStudyCase(id);
        if (response.status === "ok") {
          setCases(cases.filter((c) => c.id !== id));
          if (selectedCase?.id === id) {
            setSelectedCase(null);
          }
          showModal("Berhasil", "Study case berhasil dihapus.", "success");
        } else {
          showModal("Gagal", "Study case tidak dapat dihapus. Coba lagi.", "error");
        }
      } catch (err: any) {
        console.error("Error deleting study case:", err);
        showModal("Gagal", err.message || "Study case tidak dapat dihapus. Coba lagi.", "error");
      }
    });
  }
  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/lecturer/edit/${id}`);
  };

  const filteredCases = cases.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-full w-full bg-[#0a0f1d] text-slate-200 font-sans overflow-hidden">
      {/* Master List */}
      <div className="w-[400px] h-full border-r border-slate-800 flex flex-col shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">Study Case</h1>
              <p className="text-slate-400 text-xs mt-0.5">Kelola bahan ajar mahasiswa</p>
            </div>
            <button
              onClick={() => router.push("/lecturer/new")}
              className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Study Case
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-blue-400 placeholder:text-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
              <p className="text-slate-400 text-xs">Memuat data...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2 p-6 text-center">
              <FileText className="w-10 h-10 opacity-40" />
              <p className="text-sm font-medium text-slate-300">
                {searchQuery ? "Tidak ada yang cocok" : "Belum ada study case"}
              </p>
              <p className="text-xs">
                {searchQuery
                  ? "Coba kata kunci lain."
                  : "Buat study case pertama untuk mulai menilai mahasiswa."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {filteredCases.map((c) => (
                <li
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={cn(
                    "group cursor-pointer transition-colors px-4 py-3",
                    selectedCase?.id === c.id
                      ? "bg-slate-800/40 text-white"
                      : "hover:bg-slate-800/20 text-slate-300"
                  )}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-medium text-sm line-clamp-1 text-white">
                      {c.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 tabular-nums">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="flex justify-end gap-1 mt-1.5 -mr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEdit(c.id, e)}
                      className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="sr-only">Edit {c.title}</span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(c.id, e)}
                      className="p-1.5 rounded-md text-slate-400 hover:bg-rose-600 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="sr-only">Hapus {c.title}</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {selectedCase ? (
          <>
            <div className="px-6 py-5 border-b border-slate-800">
              <div className="max-w-4xl">
                <h2 className="text-xl font-semibold text-white mb-2">{selectedCase.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-w-3xl">
                  {selectedCase.description}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-2 flex items-center gap-2 text-xs text-slate-400 border-b border-slate-800">
                <Layers className="w-3.5 h-3.5" />
                Kunci jawaban diagram
              </div>
              <div className="flex-1 relative">
                <DiagramPreview
                  nodes={selectedCase.diagram_rules.nodes || []}
                  edges={selectedCase.diagram_rules?.edges || []}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 p-10 text-center">
            <div className="w-14 h-14 rounded-full border border-slate-700 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-1">Pilih study case</h3>
              <p className="text-xs max-w-xs mx-auto leading-relaxed">
                Pilih study case di panel kiri untuk melihat deskripsi lengkap dan kunci jawaban diagramnya.
              </p>
            </div>
          </div>
        )}
      </div>

      {modal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModal((prev) => ({ ...prev, isOpen: false }));
              if (modal.onCancel) modal.onCancel();
            }
          }}
        >
          <div
            className="bg-[#0f172a] border border-slate-700 rounded-lg w-full max-w-md p-6 shadow-xl"
            role="alertdialog"
            aria-labelledby="modal-title"
          >
            <button
              onClick={() => {
                setModal((prev) => ({ ...prev, isOpen: false }));
                if (modal.onClose) modal.onClose();
                if (modal.onCancel) modal.onCancel();
              }}
              aria-label="Tutup dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center gap-4 mt-2">
              {modal.type === "success" && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
              )}
              {(modal.type === "error" || modal.type === "confirmation") && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-full">
                  <XCircle className="w-7 h-7 text-rose-400" />
                </div>
              )}
              {modal.type === "warning" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
              )}

              <div className="space-y-2">
                <h3 id="modal-title" className="text-base font-semibold text-white">
                  {modal.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {modal.message}
                </p>
              </div>

              {modal.type === "confirmation" ? (
                <div className="flex gap-3 w-full mt-4 justify-center">
                  <button
                    onClick={() => {
                      setModal((prev) => ({ ...prev, isOpen: false }));
                      if (modal.onCancel) modal.onCancel();
                    }}
                    className="px-5 py-2 rounded-md border border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
                  >
                    Batal
                  </button>
                  <button
                    onClick={async () => {
                      setModal((prev) => ({ ...prev, isOpen: false }));
                      if (modal.onConfirm) await modal.onConfirm();
                    }}
                    className="px-5 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
                  >
                    Ya, hapus
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setModal((prev) => ({ ...prev, isOpen: false }));
                    if (modal.onClose) modal.onClose();
                  }}
                  className="mt-4 px-6 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

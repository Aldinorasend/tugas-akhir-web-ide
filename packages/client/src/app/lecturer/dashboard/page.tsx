"use client";

import { useEffect, useState } from "react";
import { getLecturerDashboardData } from "@/lib/api";
import {
  Search,
  FileCode,
  ChevronRight,
  ArrowLeftRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Flame,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LecturerDashboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"EXPERIMENTAL" | "CONTROL">("EXPERIMENTAL");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const result = await getLecturerDashboardData();
      setData(result.data || []);
    } catch (error) {
      console.error("Error Fetching Dashboard Data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter students based on group & search query
  const filteredStudents = data.filter((student) => {
    const isSameGroup = student.experiment_group === activeTab;
    const matchesSearch =
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nim_nip?.toLowerCase().includes(searchQuery.toLowerCase());
    return isSameGroup && matchesSearch;
  });

  // Calculate high-level stats
  const experimentalStudents = data.filter(s => s.experiment_group === "EXPERIMENTAL");
  const controlStudents = data.filter(s => s.experiment_group === "CONTROL");

  const getStats = (groupStudents: any[]) => {
    const total = groupStudents.length;
    if (total === 0) return { total: 0, completedDiagram: 0, completedCode: 0, completedAll: 0, avgDiagramSubmits: "0", totalHints: 0 };

    let completedDiagram = 0;
    let completedCode = 0;
    let completedAll = 0;
    let totalDiagramSubmits = 0;
    let totalDiagAttempted = 0;
    let totalHints = 0;

    groupStudents.forEach(student => {
      student.exercises.forEach((ex: any) => {
        if (ex.diagram?.is_passed) {
          completedDiagram++;
        }
        if (ex.code?.is_passed) {
          completedCode++;
        }
        if (ex.diagram?.is_passed && ex.code?.is_passed) {
          completedAll++;
        }
        if (ex.diagram) {
          totalDiagramSubmits += ex.diagram.submit_count || 0;
          totalDiagAttempted++;
        }
        totalHints += ex.logs?.length || 0;
      });
    });

    return {
      total,
      completedDiagram,
      completedCode,
      completedAll,
      avgDiagramSubmits: totalDiagAttempted > 0 ? (totalDiagramSubmits / totalDiagAttempted).toFixed(1) : "0",
      totalHints
    };
  };

  const currentStats = activeTab === "EXPERIMENTAL" ? getStats(experimentalStudents) : getStats(controlStudents);

  const formatDuration = (ms: number) => {
    if (!ms) return "0s";
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    if (min > 0) {
      return `${min}m ${sec % 60}s`;
    }
    return `${sec}s`;
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toUpperCase()) {
      case "MOVERS":
        return "text-emerald-400";
      case "TINKERERS":
        return "text-sky-400";
      case "STOPPERS":
        return "text-rose-400";
      default:
        return "text-slate-400";
    }
  };

  const stats = [
    { label: "Total mahasiswa", value: String(currentStats.total), unit: "" },
    { label: "Selesai diagram", value: String(currentStats.completedDiagram), unit: "kasus" },
    { label: "Selesai kode", value: String(currentStats.completedCode), unit: "kasus" },
    { label: "Selesai semua", value: String(currentStats.completedAll), unit: "kasus" },
    { label: "Rerata submit diagram", value: String(currentStats.avgDiagramSubmits), unit: "x" },
    activeTab === "EXPERIMENTAL"
      ? { label: "Total hint dipicu", value: String(currentStats.totalHints), unit: "hint" }
      : { label: "Hint", value: "N/A", unit: "dinonaktifkan" }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0f1d] text-slate-200 font-sans overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Dashboard Monitoring Scaffolding
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Analisis kemajuan dan metrik kognitif mahasiswa per kelompok
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-md text-slate-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Muat ulang
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Stats + Student List */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">

          {/* Tabs & Search */}
          <div className="px-6 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab("EXPERIMENTAL")}
                aria-pressed={activeTab === "EXPERIMENTAL"}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-blue-400",
                  activeTab === "EXPERIMENTAL"
                    ? "bg-slate-700 text-white"
                     : "text-slate-400 hover:text-slate-200"
                )}
              >
                <ZapLikeIcon />
                Eksperimen (Scaffolding)
              </button>
              <button
                onClick={() => setActiveTab("CONTROL")}
                aria-pressed={activeTab === "CONTROL"}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-blue-400",
                  activeTab === "CONTROL"
                    ? "bg-slate-700 text-white"
                     : "text-slate-400 hover:text-slate-200"
                )}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Kontrol (Non-Scaffolding)
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari mahasiswa (NIM/Nama)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-blue-400 placeholder:text-slate-400 transition-colors"
              />
            </div>
          </div>

          {/* Group Stats */}
          <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 border-b border-slate-800 shrink-0">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="mt-1 text-xl font-semibold text-white tabular-nums">
                  {s.value}
                  {s.unit && (
                    <span className="ml-1 text-xs font-normal text-slate-400">{s.unit}</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Student Table */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
                <p className="text-slate-400 text-xs">Memuat data mahasiswa...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3 text-center px-6">
                <UsersIcon />
                <div>
                  <p className="text-sm font-medium text-slate-300">Tidak ada mahasiswa ditemukan</p>
                  <p className="text-xs max-w-xs mx-auto mt-0.5">
                    Kelompok ini masih kosong, atau coba kata kunci lain.
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs">
                    <th scope="col" className="py-2.5 px-6 font-medium">Mahasiswa</th>
                    <th scope="col" className="py-2.5 px-4 font-medium">Diagram</th>
                    <th scope="col" className="py-2.5 px-4 font-medium">Kode</th>
                    <th scope="col" className="py-2.5 px-4 font-medium">Semua</th>
                    <th scope="col" className="py-2.5 px-4 font-medium">Rerata nilai</th>
                    <th scope="col" className="py-2.5 px-4 font-medium">Hint</th>
                    <th scope="col" className="py-2.5 px-6 text-right font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((student) => {
                    const completedDiagram = student.exercises.filter((ex: any) => ex.diagram?.is_passed).length;
                    const completedCode = student.exercises.filter((ex: any) => ex.code?.is_passed).length;
                    const completedAll = student.exercises.filter((ex: any) => ex.diagram?.is_passed && ex.code?.is_passed).length;
                    const attemptedCount = student.exercises.length;

                    let averageScore = 0;
                    if (attemptedCount > 0) {
                      const sum = student.exercises.reduce((acc: number, ex: any) => acc + (ex.score || 0), 0);
                      averageScore = Math.round(sum / attemptedCount);
                    }

                    const totalHints = student.exercises.reduce((acc: number, ex: any) => acc + (ex.logs?.length || 0), 0);

                    return (
                      <tr
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={cn(
                          "group cursor-pointer transition-colors text-sm",
                          selectedStudent?.id === student.id
                            ? "bg-slate-800/40 text-white"
                            : "hover:bg-slate-800/20 text-slate-300"
                        )}
                      >
                        <td className="py-3 px-6">
                          <div className="font-medium text-white">
                            {student.full_name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{student.nim_nip}</div>
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <span className={completedDiagram > 0 ? "text-emerald-400" : "text-slate-500"}>
                            {completedDiagram} / {attemptedCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <span className={completedCode > 0 ? "text-sky-400" : "text-slate-500"}>
                            {completedCode} / {attemptedCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <span className={completedAll > 0 ? "text-violet-400" : "text-slate-500"}>
                            {completedAll} / {attemptedCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <span
                            className={cn(
                              "font-medium",
                              averageScore === 100 ? "text-emerald-400" : averageScore >= 50 ? "text-slate-200" : "text-slate-400"
                            )}
                          >
                            {averageScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          {student.experiment_group === "EXPERIMENTAL" ? (
                            <span className={totalHints > 5 ? "text-rose-400" : totalHints > 0 ? "text-slate-300" : "text-slate-500"}>
                              {totalHints}
                            </span>
                          ) : (
                            <span className="text-slate-500">â€”</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(student);
                            }}
                            aria-label={`Lihat detail ${student.full_name}`}
                            className="p-1.5 rounded-md text-slate-400 group-hover:text-white group-hover:bg-slate-700 hover:bg-blue-600 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="w-full md:w-[480px] h-full bg-[#0a0f1d] flex flex-col overflow-hidden shrink-0 border-l border-slate-800">
          {selectedStudent ? (
            <>
              <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between">
                <div>
                  <p className={cn(
                    "text-xs font-medium mb-1",
                    selectedStudent.experiment_group === "EXPERIMENTAL" ? "text-blue-400" : "text-slate-400"
                  )}>
                    Kelompok {selectedStudent.experiment_group === "EXPERIMENTAL" ? "Eksperimen (Scaffolding)" : "Kontrol"}
                  </p>
                  <h2 className="text-base font-semibold text-white leading-tight">{selectedStudent.full_name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">NIM {selectedStudent.nim_nip}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  aria-label="Tutup detail"
                  className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-blue-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Kemajuan kasus pembelajaran</h3>

                {selectedStudent.exercises.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-700 rounded-lg text-center text-slate-400 gap-2">
                    <FileCode className="w-8 h-8 opacity-40" />
                    <p className="text-xs">Mahasiswa belum pernah mencoba mengerjakan kasus apa pun.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {selectedStudent.exercises.map((ex: any) => {
                      const isExpanded = expandedExercise === ex.exercise_id;
                      const passedDiagram = ex.diagram?.is_passed;
                      const passedCode = ex.code?.is_passed;

                      return (
                        <div key={ex.exercise_id} className="py-3">
                          {/* Summary row */}
                          <button
                            onClick={() => setExpandedExercise(isExpanded ? null : ex.exercise_id)}
                            aria-expanded={isExpanded}
                            className="w-full text-left flex items-center justify-between gap-4 py-1 group focus-visible:outline-2 focus-visible:outline-blue-400 rounded"
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-white truncate">{ex.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className={passedDiagram ? "text-emerald-400" : "text-slate-500"}>
                                  Diagram {passedDiagram ? "lulus" : "berjalan"}
                                </span>
                                <span className={passedCode ? "text-emerald-400" : "text-slate-500"}>
                                  Kode {passedCode ? "lulus" : "berjalan"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-medium text-white tabular-nums">{ex.score || 0}%</span>
                              {isExpanded
                                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />}
                            </div>
                          </button>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-4">
                              {/* Diagram phase */}
                              <div>
                                <h5 className="font-medium text-slate-300 mb-2">Fase desain diagram</h5>
                                {ex.diagram ? (
                                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div>
                                      <dt className="text-slate-400">Waktu pengerjaan</dt>
                                      <dd className="text-slate-200 tabular-nums">{formatDuration(ex.diagram.time_spent_ms)}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-slate-400">Aksi / submit</dt>
                                      <dd className="text-slate-200 tabular-nums">{ex.diagram.total_actions || 0} / {ex.diagram.submit_count || 0}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-slate-400">Indeks frustrasi (0â€“100)</dt>
                                      <dd className={cn(
                                        "tabular-nums flex items-center gap-1",
                                        ex.diagram.frustration_index > 70 ? "text-rose-400" : ex.diagram.frustration_index > 40 ? "text-amber-400" : "text-emerald-400"
                                      )}>
                                        <Flame className="w-3 h-3 shrink-0" />
                                        {ex.diagram.frustration_index || 0}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-slate-400">Kategori</dt>
                                      <dd className={cn("font-medium uppercase tracking-wide", getCategoryColor(ex.diagram.detected_category))}>
                                        {ex.diagram.detected_category || "â€”"}
                                      </dd>
                                    </div>
                                  </dl>
                                ) : (
                                  <p className="text-slate-500">Belum ada aktivitas diagram.</p>
                                )}
                              </div>

                              {/* Code phase */}
                              <div>
                                <h5 className="font-medium text-slate-300 mb-2">Fase implementasi kode</h5>
                                {ex.code ? (
                                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div>
                                      <dt className="text-slate-400">Waktu pengerjaan</dt>
                                      <dd className="text-slate-200 tabular-nums">{formatDuration(ex.code.time_spent_ms)}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-slate-400">Keystroke / baris</dt>
                                      <dd className="text-slate-200 tabular-nums">{ex.code.keystroke_count || 0} / {ex.code.lines_of_code || 0}</dd>
                                    </div>
                                    <div>
                                      <dt className="text-slate-400">Error sintaks / logika</dt>
                                      <dd className={cn("tabular-nums", (ex.code.syntax_error_count || 0) + (ex.code.logical_error_count || 0) > 0 ? "text-rose-400" : "text-slate-200")}>
                                        {ex.code.syntax_error_count || 0} / {ex.code.logical_error_count || 0}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-slate-400">Kategori</dt>
                                      <dd className={cn("font-medium uppercase tracking-wide", getCategoryColor(ex.code.detected_category))}>
                                        {ex.code.detected_category || "â€”"}
                                      </dd>
                                    </div>
                                  </dl>
                                ) : (
                                  <p className="text-slate-500">Belum ada aktivitas koding.</p>
                                )}
                              </div>

                              {/* Scaffolding logs */}
                              {selectedStudent.experiment_group === "EXPERIMENTAL" && (
                                <div>
                                  <h5 className="font-medium text-slate-300 mb-2">
                                    Riwayat intervensi scaffolding ({ex.logs?.length || 0})
                                  </h5>
                                  {ex.logs && ex.logs.length > 0 ? (
                                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                      {ex.logs.map((log: any) => (
                                        <li key={log.id} className="p-3 bg-slate-900 rounded-md space-y-1">
                                          <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-blue-400">
                                              Level {log.scaffolding_level} Â· {log.trigger_phase}
                                            </span>
                                            <span className="text-slate-400 tabular-nums">
                                              {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-300 leading-relaxed">
                                            {log.hint_message}
                                          </p>
                                          <p className="text-[11px] text-slate-400">
                                            Pemicu {log.trigger_reason} Â· skor saat itu {log.current_score}%
                                          </p>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-emerald-400">
                                      Tidak perlu intervensi scaffolding pada kasus ini.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 p-10 text-center">
              <div className="w-14 h-14 rounded-full border border-slate-700 flex items-center justify-center">
                <Info className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-1">Pilih mahasiswa</h3>
                <p className="text-xs max-w-xs mx-auto leading-relaxed">
                  Klik salah satu mahasiswa pada tabel di kiri untuk melihat rincian diagram, kode, dan riwayat scaffolding.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Ikon kecil yang dipakai lebih dari satu kali â€” satu stroke, satu weight */
function ZapLikeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 opacity-40" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

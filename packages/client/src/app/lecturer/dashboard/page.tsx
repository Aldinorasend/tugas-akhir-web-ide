"use client";

import { useEffect, useState } from "react";
import { getLecturerDashboardData } from "@/lib/api";
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Layers, 
  FileCode, 
  ChevronRight, 
  ArrowLeftRight, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Code,
  Flame,
  Award,
  Zap,
  Activity,
  History,
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
    if (total === 0) return { total: 0, completedDiagram: 0, completedCode: 0, completedAll: 0, avgDiagramSubmits: 0, totalHints: 0 };

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
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "TINKERERS":
        return "text-sky-400 bg-sky-500/10 border-sky-500/20";
      case "STOPPERS":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0f1d] text-slate-200 font-sans overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="text-blue-500 w-5.5 h-5.5" />
            Dashboard Monitoring Scaffolding
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Analisis kemajuan dan metrik kognitif mahasiswa secara real-time</p>
        </div>

        <div className="flex gap-3">
          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold"
            title="Muat Ulang Data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Sync
          </button>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Stats + Student List */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-850 bg-slate-950/20">
          
          {/* Tabs & Search */}
          <div className="p-4 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-950/40">
            <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab("EXPERIMENTAL")}
                className={cn(
                  "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2",
                  activeTab === "EXPERIMENTAL"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                    : "text-slate-500 hover:text-slate-350"
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                Eksperimen (Scaffolding)
              </button>
              <button
                onClick={() => setActiveTab("CONTROL")}
                className={cn(
                  "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-2",
                  activeTab === "CONTROL"
                    ? "bg-slate-850 text-white"
                    : "text-slate-500 hover:text-slate-350"
                )}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Kontrol (Non-Scaffolding)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari mahasiswa (NIM/Nama)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 outline-none focus:border-slate-700 placeholder:text-slate-600 transition-all"
              />
            </div>
          </div>

          {/* Group Stats Card Overview */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 bg-slate-950/20 border-b border-slate-850 shrink-0">
            {/* Card 1: Total Mahasiswa */}
            <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Mahasiswa</p>
                <h3 className="text-lg font-black text-white mt-0.5">{currentStats.total}</h3>
              </div>
            </div>

            {/* Card 2: Selesai Diagram */}
            <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Selesai Diagram</p>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {currentStats.completedDiagram}
                  <span className="text-slate-500 text-[10px] font-medium ml-1">kasus</span>
                </h3>
              </div>
            </div>

            {/* Card 3: Selesai Kode */}
            <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Selesai Kode</p>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {currentStats.completedCode}
                  <span className="text-slate-500 text-[10px] font-medium ml-1">kasus</span>
                </h3>
              </div>
            </div>

            {/* Card 4: Selesai Semua */}
            <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Selesai Semua</p>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {currentStats.completedAll}
                  <span className="text-slate-500 text-[10px] font-medium ml-1">kasus</span>
                </h3>
              </div>
            </div>

            {/* Card 5: Rerata Submit Diagram */}
            <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rerata Submit Diag</p>
                <h3 className="text-lg font-black text-white mt-0.5">{currentStats.avgDiagramSubmits}x</h3>
              </div>
            </div>

            {/* Card 6: Total Hint Dipicu */}
            <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-xl border",
                activeTab === "EXPERIMENTAL" 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                  : "bg-slate-800/10 border-slate-800 text-slate-500"
              )}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {activeTab === "EXPERIMENTAL" ? "Total Hint Dipicu" : "Hint Dinonaktifkan"}
                </p>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {activeTab === "EXPERIMENTAL" ? `${currentStats.totalHints} Hint` : "N/A"}
                </h3>
              </div>
            </div>
          </div>

          {/* Student Table List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
                <p className="text-slate-500 text-xs">Menyinkronkan data mahasiswa...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-3 text-center px-6">
                <Users className="w-12 h-12 opacity-20" />
                <div>
                  <p className="text-sm font-semibold text-slate-500">Tidak ada mahasiswa ditemukan</p>
                  <p className="text-xs text-slate-650 max-w-xs mx-auto mt-0.5">
                    Tidak ada mahasiswa di kelompok ini atau cari kata kunci lain.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-900/10">
                      <th className="py-3 px-6">Identitas Mahasiswa</th>
                      <th className="py-3 px-4">Selesai Diagram</th>
                      <th className="py-3 px-4">Selesai Kode</th>
                      <th className="py-3 px-4">Selesai Semua</th>
                      <th className="py-3 px-4">Rerata Nilai</th>
                      <th className="py-3 px-4">Log Scaffolding</th>
                      <th className="py-3 px-6 text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
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
                            "group cursor-pointer transition-colors text-xs",
                            selectedStudent?.id === student.id
                              ? "bg-slate-800/20 text-white"
                              : "hover:bg-slate-800/10 text-slate-350"
                          )}
                        >
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                {student.full_name}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{student.nim_nip}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-md font-bold text-[10px] border",
                              completedDiagram > 0 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-slate-900 border-slate-850 text-slate-500"
                            )}>
                              {completedDiagram} / {attemptedCount || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-md font-bold text-[10px] border",
                              completedCode > 0 
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                                : "bg-slate-900 border-slate-850 text-slate-500"
                            )}>
                              {completedCode} / {attemptedCount || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-md font-bold text-[10px] border",
                              completedAll > 0 
                                ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                                : "bg-slate-900 border-slate-850 text-slate-500"
                            )}>
                              {completedAll} / {attemptedCount || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={cn(
                              "font-bold text-sm",
                              averageScore === 100 ? "text-emerald-400" : averageScore >= 50 ? "text-amber-400" : "text-slate-400"
                            )}>
                              {averageScore}%
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {student.experiment_group === "EXPERIMENTAL" ? (
                              <span className={cn(
                                "px-2 py-0.5 rounded-full border text-[10px] font-semibold",
                                totalHints > 5 
                                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                                  : totalHints > 0 
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                                  : "bg-slate-900 border-slate-800 text-slate-500"
                              )}>
                                {totalHints} Hint Dipicu
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button className="p-1 bg-slate-900 border border-slate-800 group-hover:border-slate-700 hover:bg-blue-600 group-hover:text-white rounded-lg text-slate-400 transition-all inline-flex items-center justify-center">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Progress View */}
        <div className="w-full md:w-[480px] h-full bg-[#0a0f1d] flex flex-col overflow-hidden shrink-0 border-l border-slate-850">
          {selectedStudent ? (
            <>
              {/* Header Details */}
              <div className="p-6 border-b border-slate-850 bg-slate-900/10 flex items-start justify-between">
                <div>
                  <span className={cn(
                    "px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-md mb-2 inline-block",
                    selectedStudent.experiment_group === "EXPERIMENTAL"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  )}>
                    Kelompok {selectedStudent.experiment_group === "EXPERIMENTAL" ? "Eksperimen (Scaffolding)" : "Kontrol (Standard)"}
                  </span>
                  <h2 className="text-lg font-black text-white leading-tight">{selectedStudent.full_name}</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">NIM: {selectedStudent.nim_nip}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
                  title="Tutup Detail"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List of Student Exercises details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Kemajuan Kasus Pembelajaran
                </h3>

                {selectedStudent.exercises.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-slate-850 border-dashed rounded-2xl text-center text-slate-600 gap-2">
                    <FileCode className="w-8 h-8 opacity-25" />
                    <p className="text-xs">Mahasiswa belum pernah mencoba mengerjakan kasus apa pun.</p>
                  </div>
                ) : (
                  selectedStudent.exercises.map((ex: any) => {
                    const isExpanded = expandedExercise === ex.exercise_id;
                    const passedDiagram = ex.diagram?.is_passed;
                    const passedCode = ex.code?.is_passed;

                    return (
                      <div
                        key={ex.exercise_id}
                        className="bg-slate-950/40 border border-slate-850 rounded-2xl overflow-hidden"
                      >
                        {/* Summary Header */}
                        <div
                          onClick={() => setExpandedExercise(isExpanded ? null : ex.exercise_id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/10 transition-colors"
                        >
                          <div className="flex-1 pr-4">
                            <h4 className="font-bold text-xs text-white line-clamp-1">{ex.title}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              {/* Diagram status tag */}
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 border",
                                passedDiagram 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                  : "bg-slate-900 border-slate-800 text-slate-500"
                              )}>
                                Diagram: {passedDiagram ? "Passed" : "In Progress"}
                              </span>
                              {/* Code status tag */}
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 border",
                                passedCode 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                  : "bg-slate-900 border-slate-800 text-slate-500"
                              )}>
                                Kode: {passedCode ? "Passed" : "In Progress"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-white">{ex.score || 0}%</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-slate-850/80 bg-slate-950/60 text-xs space-y-4 pt-4">
                            {/* Phase 1: Diagram Metrics */}
                            <div>
                              <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-blue-500" />
                                Fase Desain Diagram
                              </h5>
                              {ex.diagram ? (
                                <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-3 rounded-xl border border-slate-850/60">
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Waktu Pengerjaan</span>
                                    <span className="font-semibold text-slate-300">{formatDuration(ex.diagram.time_spent_ms)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Total Aksi / Submit</span>
                                    <span className="font-semibold text-slate-300">{ex.diagram.total_actions || 0} aksi / {ex.diagram.submit_count || 0} kali</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Metrik Frustrasi (0-100)</span>
                                    <span className={cn(
                                      "font-black flex items-center gap-1",
                                      ex.diagram.frustration_index > 70 ? "text-rose-400" : ex.diagram.frustration_index > 40 ? "text-amber-400" : "text-emerald-400"
                                    )}>
                                      <Flame className="w-3 h-3 shrink-0" />
                                      {ex.diagram.frustration_index || 0}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Kategori Kognitif</span>
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider inline-block mt-0.5",
                                      getCategoryColor(ex.diagram.detected_category)
                                    )}>
                                      {ex.diagram.detected_category}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-600 italic pl-1">Belum ada aktivitas diagram.</p>
                              )}
                            </div>

                            {/* Phase 2: Coding Metrics */}
                            <div>
                              <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Code className="w-3.5 h-3.5 text-blue-500" />
                                Fase Implementasi Kode
                              </h5>
                              {ex.code ? (
                                <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-3 rounded-xl border border-slate-850/60">
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Waktu Pengerjaan</span>
                                    <span className="font-semibold text-slate-300">{formatDuration(ex.code.time_spent_ms)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Keystrokes / LOC</span>
                                    <span className="font-semibold text-slate-300">{ex.code.keystroke_count || 0} tombol / {ex.code.lines_of_code || 0} baris</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Syntax / Logical Error</span>
                                    <span className="font-semibold text-slate-300 text-rose-400">{ex.code.syntax_error_count || 0} / {ex.code.logical_error_count || 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">Kategori Kognitif</span>
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider inline-block mt-0.5",
                                      getCategoryColor(ex.code.detected_category)
                                    )}>
                                      {ex.code.detected_category}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-600 italic pl-1">Belum ada aktivitas koding.</p>
                              )}
                            </div>

                            {/* Scaffolding Logs Detail */}
                            {selectedStudent.experiment_group === "EXPERIMENTAL" && (
                              <div>
                                <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <History className="w-3.5 h-3.5 text-blue-500" />
                                  Riwayat Intervensi Scaffolding ({ex.logs?.length || 0})
                                </h5>
                                {ex.logs && ex.logs.length > 0 ? (
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {ex.logs.map((log: any) => (
                                      <div
                                        key={log.id}
                                        className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1.5"
                                      >
                                        <div className="flex justify-between items-center text-[9px]">
                                          <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold rounded">
                                            Level {log.scaffolding_level} ({log.trigger_phase})
                                          </span>
                                          <span className="text-slate-500">
                                            {new Date(log.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic border-l-2 border-slate-700 pl-2">
                                          "{log.hint_message}"
                                        </p>
                                        <div className="text-[9px] text-slate-500 flex justify-between">
                                          <span>Pemicu: <span className="text-slate-450 font-bold">{log.trigger_reason}</span></span>
                                          <span>Skor saat dipicu: <span className="text-slate-450 font-bold">{log.current_score}%</span></span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-emerald-500 italic pl-1">
                                    Hebat! Mahasiswa tidak memerlukan bantuan scaffolding (0 intervensi).
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center shadow-lg">
                <Info className="w-8 h-8 opacity-20 text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-1">Pilih Mahasiswa</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Silakan klik salah satu mahasiswa pada tabel di sebelah kiri untuk melihat rincian aktivitas diagram, pengerjaan kode, dan riwayat intervensi scaffolding.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

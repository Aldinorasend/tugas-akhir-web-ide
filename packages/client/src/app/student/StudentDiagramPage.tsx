"use client";

import DiagramCanvas from "@/components/diagram/DiagramCanvas";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import { getRandomStudyCase, getStudyCaseById, graderCode } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shuffle, Lock, Unlock, Sparkles, Timer } from "lucide-react";
import ProjectExplorer from "@/components/ProjectExplorer";
import JavaEditor from "@/components/JavaEditor";
import OutputPanel from "@/components/OutputPanel";
import { useSocket } from "@/hooks/useWebsocket";
import { graderDiagram,  } from "@/lib/api";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function StudentDiagramPage() {
    const [gradeResult, setGradeResult] = useState<{ score: number, feedbacks: string[], isPassed: boolean } | null>(null);
    const [stage, setStage] = useState<1 | 2 | 3>(3);
    const [studyCase, setStudyCase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nim, setNim] = useState("");
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Multiple tabs UI state
    const [activeTab, setActiveTab] = useState<"diagram" | "code">("diagram");
    const [isIdeUnlocked, setIsIdeUnlocked] = useState(true);
    const [showScaffolding, setShowScaffolding] = useState(false);

    const diagramRef = useRef<any>(null); // Ref to the canvas
    const searchParams = useSearchParams();

    // Shared Workspace and Socket compiler hook
    const {
        nodes,
        setNodes,
        selectedId,
        setSelectedId,
        currentFile,
        handleToggleFolder,
        handleAddFile,
        handleAddFolder,
        handleDelete,
        handleRename,
        handleCodeChange,
        flattenFiles,
    } = useWorkspace();
    const { output, isRunning, runJavaCode } = useSocket();
    const handleRun =async () => {
        const allFiles = flattenFiles(nodes).filter(file => file.path.endsWith('.java'));

        if (allFiles.length === 0) return alert("Tidak ada kode Java!");

        try {
            // Kirim allFiles sebagai array, bukan string gabungan
            const result = await graderCode(allFiles, studyCase.answer_key.logic_rules);

            if (result.success) {
                const summary = result.results
                    .map((r: any) => `${r.status}: ${r.rule}`)
                    .join('\n');
                alert(`Hasil Analisis:\n\n${summary}`);
            }
        } catch (error: any) {
            console.error("Test Matcher Error:", error);
        }
    };

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && !gradeResult?.isPassed) {
            interval = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, gradeResult?.isPassed]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return [
            h > 0 ? h : null,
            m.toString().padStart(2, '0'),
            s.toString().padStart(2, '0')
        ].filter(Boolean).join(':');
    };

    // Helper to extract and set the IDE starter files
    const setIDEStarterFiles = (actualData: any) => {
        if (actualData.initial_code) {
            try {
                const parsedCode = typeof actualData.initial_code === "string"
                    ? JSON.parse(actualData.initial_code)
                    : actualData.initial_code;
                if (Array.isArray(parsedCode)) {
                    setNodes(parsedCode);
                    const findFirstFile = (list: any[]): any | null => {
                        for (const node of list) {
                            if (node.type === "file") return node;
                            if (node.children) {
                                const found = findFirstFile(node.children);
                                if (found) return found;
                            }
                        }
                        return null;
                    };
                    const firstFile = findFirstFile(parsedCode);
                    if (firstFile) {
                        setSelectedId(firstFile.id);
                    }
                }
            } catch (err) {
                console.error("Failed to parse initial_code in student IDE", err);
            }
        } else {
            setNodes([
                {
                    id: "Main.java",
                    name: "Main.java",
                    type: "file",
                    content: `public class Main {\n    public static void main(String[] args) {\n        // Enter student template code with bugs to solve...\n        System.out.println("Hello, Pathwise!");\n    }\n}`,
                },
            ]);
            setSelectedId("Main.java");
        }
    };

    // Loading the Study Case
    const loadCase = async () => {
        setLoading(true);
        try {
            const id = searchParams.get("id");

            if (id) {
                const response = await getStudyCaseById(id);
                const actualData = response?.data || response;
                if (actualData) {
                    if (!actualData.answer_key) {
                        actualData.answer_key = actualData.diagram_rules;
                    }
                    setStudyCase(actualData);
                    setIDEStarterFiles(actualData);
                }
            } else {
                const response = await getRandomStudyCase();
                const actualData = response?.data || response;
                if (actualData) {
                    if (!actualData.answer_key) {
                        actualData.answer_key = actualData.diagram_rules;
                    }
                    setStudyCase(actualData);
                    setIDEStarterFiles(actualData);
                    const params = new URLSearchParams(window.location.search);
                    params.set("id", actualData.id);
                    window.history.pushState(null, "", `?${params.toString()}`);
                }
            }
        } catch (err) {
            console.error("Failed to load case", err);
        } finally {
            setLoading(false);
            setIsTimerRunning(true);
        }
    };

    const handleRandomize = async () => {
        setLoading(true);
        try {
            const response = await getRandomStudyCase();
            const actualData = response?.data || response;
            if (actualData) {
                if (!actualData.answer_key) {
                    actualData.answer_key = actualData.diagram_rules;
                }
                setStudyCase(actualData);

                // Reset canvas, scoring, active tabs & IDE states
                setGradeResult(null);
                setStage(3);
                setActiveTab("diagram");
                setIsIdeUnlocked(false);
                if (diagramRef.current) {
                    diagramRef.current.setDiagram([], []);
                }
                setIDEStarterFiles(actualData);

                const params = new URLSearchParams(window.location.search);
                params.set("id", actualData.id);
                window.history.pushState(null, "", `?${params.toString()}`);
            }
        } catch (err) {
            console.error("Failed to randomize case", err);
            alert("Gagal mengambil study case acak.");
        } finally {
            setLoading(false);
            setTimeElapsed(0);
            setIsTimerRunning(true);
        }
    };

    useEffect(() => {
        loadCase();
    }, [searchParams]);

    // Poping up Skeleton Diagram
    const triggerStage1Injection = () => {
        if (!diagramRef.current || !studyCase?.answer_key) return;

        const skeletonNodes = studyCase.answer_key.nodes.map((node: any) => ({
            ...node,
            data: { ...node.data, attributes: [], methods: [] }
        }));

        diagramRef.current.setNodes(skeletonNodes);
    };

    const handleSubmit = async () => {
        const studentData = diagramRef.current?.getSnapshot();
        if (!studentData || !nim) return alert("Isi NIM dan lengkapi diagram!");

        setIsSubmitting(true);
        try {
            const result = await graderDiagram(studyCase.id, studentData.nodes, studentData.edges, timeElapsed);

            if (result.success) {
                setGradeResult({
                    score: result.score / 100, // Karena server kirim 0-100, state mau 0-1
                    feedbacks: result.hints,
                    isPassed: result.isCorrect
                }); 

                if (result.isCorrect) {
                    setIsIdeUnlocked(true); // Membuka akses ke editor Java
                }
            }

            // Simpan ke Supabase (tanpa error handling agar UI tetap responsif)


        } catch (error) {
            console.error("Error grading:", error);
            alert("Gagal mengirim jawaban. Coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };




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
            <div className="w-86 h-full overflow-y-auto border-r border-slate-800 bg-[#0f172a] p-6 flex flex-col shadow-2xl">
                <div className="border-dashed p-3 border border-blue-600 rounded-lg mb-6 flex justify-between items-center bg-blue-950/20">
                    <h1 className="font-bold text-white text-lg">Study Case</h1>
                    <button
                        onClick={handleRandomize}
                        title="Load Random Case"
                        className="p-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-400 hover:text-blue-300 rounded-lg transition-all border border-slate-700/50 flex items-center justify-center gap-1.5"
                    >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">Random</span>
                    </button>
                </div>

                <div className="flex flex-col mb-6">
                    <h3 className="text-md font-semibold text-blue-600 "> Title:</h3>
                    <h3 className="text-md font-semibold text-white">{studyCase?.title}</h3>
                </div>
                <div className="flex flex-col mb-4">
                    <h1 className="text-md font-semibold text-blue-600 "> Description: </h1>
                    <p className="text-sm text-white  leading-relaxed whitespace-pre-line text-justify">{studyCase?.description}</p>
                </div>

                <input
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="NIM"
                    className="w-full p-3 mb-4 bg-slate-800 rounded-xl border border-slate-700 text-white outline-none focus:ring-1 focus:ring-blue-500"
                />

                <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3 bg-green-600 rounded-xl font-bold">
                    {isSubmitting ? "Grading..." : "Submit Answer"}
                </button>

                <div className="mt-auto pt-6 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase mb-3">Support Stage</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[3, 2, 1].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => {
                                    setStage(lvl as any);
                                    setShowScaffolding(true);
                                    if (lvl === 1) triggerStage1Injection();
                                }}
                                className={`py-2 rounded-lg text-xs font-bold transition-all ${stage === lvl ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                            >
                                L{lvl}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 h-full flex flex-col bg-[#0c0c0c] overflow-hidden">
                {/* Tab Selector Header */}
                <div className="h-14 bg-[#0f172a] border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setActiveTab("diagram")}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === "diagram"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "text-slate-500 hover:text-slate-300 border border-transparent"
                                }`}
                        >
                            <span>UML Diagram Workspace</span>
                        </button>

                        <button
                            disabled={!isIdeUnlocked}
                            onClick={() => setActiveTab("code")}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 relative group ${activeTab === "code"
                                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                : isIdeUnlocked
                                    ? "text-slate-500 hover:text-slate-300 border border-transparent"
                                    : "text-slate-600 cursor-not-allowed opacity-60"
                                }`}
                        >
                            {isIdeUnlocked ? (
                                <Unlock className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                                <Lock className="w-3.5 h-3.5 text-slate-600" />
                            )}
                            <span>Java IDE Code Sandbox</span>
                            {!isIdeUnlocked && (
                                <span className="absolute left-1/2 -bottom-10 -translate-x-1/2 bg-slate-950 text-[9px] text-slate-300 px-2 py-1 rounded border border-slate-800 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 shadow-xl">
                                    🔒 Match your UML Diagram first to unlock!
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-500/5 border border-blue-500/20 rounded-xl shadow-inner group transition-all hover:bg-blue-500/10">
                            <div className="flex items-center gap-2">
                                <Timer className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Elapsed</span>
                            </div>
                            <span className="text-sm font-mono font-bold text-white tabular-nums">
                                {formatTime(timeElapsed)}
                            </span>
                        </div>

                        <button
                            onClick={() => setShowScaffolding(!showScaffolding)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${showScaffolding
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                                }`}
                        >
                            <Sparkles className={`w-3 h-3 ${showScaffolding ? "animate-pulse" : ""}`} />
                            <span>{showScaffolding ? "Hide Scaffolding" : "Show Scaffolding"}</span>
                        </button>

                        {activeTab === "diagram" ? (
                            <div className="bg-blue-500/10 text-blue-400 border border-blue-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Analyzing UML Specifications
                            </div>
                        ) : (
                            <div className="bg-orange-500/10 text-orange-400 border border-orange-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Solving starter code errors
                            </div>
                        )}
                    </div>
                </div>

                {/* Workspace Content */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Diagram Tab */}
                    <div className={`w-full h-full relative ${activeTab === "diagram" ? "" : "hidden"}`}>
                        <DiagramCanvas ref={diagramRef} />
                    </div>

                    {/* Code IDE Tab */}
                    {isIdeUnlocked && (
                        <div className={`w-full h-full flex overflow-hidden ${activeTab === "code" ? "" : "hidden"}`}>
                            <ProjectExplorer
                                nodes={nodes}
                                selectedId={selectedId}
                                onFileSelect={(node) => setSelectedId(node.id)}
                                onToggleFolder={handleToggleFolder}
                                onAddFile={handleAddFile}
                                onAddFolder={handleAddFolder}
                                onDelete={handleDelete}
                                onRename={handleRename}
                            />

                            <div className="flex flex-1 flex-col overflow-hidden bg-[#181818]">
                                {currentFile ? (
                                    <div className="flex flex-1 flex-col overflow-hidden">
                                        <JavaEditor
                                            code={currentFile.content || ""}
                                            fileName={currentFile.name}
                                            onCodeChange={handleCodeChange}
                                            onRun={handleRun}
                                        />
                                        <OutputPanel
                                            output={output}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3 bg-[#141414]">
                                        <div className="p-4 bg-white/5 rounded-full border border-white/10">
                                            <Sparkles className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-300">Java Starter Sandbox</h3>
                                        <p className="text-xs max-w-sm text-center leading-relaxed text-slate-500 animate-pulse">
                                            Congratulations on matching your UML Diagram! Now select your Java source files in the Explorer to fix errors and write your classes.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showScaffolding && (
                <ScaffoldingPanel
                    stage={stage}
                    activeTab={activeTab}
                    answerKey={studyCase?.answer_key}
                    diagramRef={diagramRef}
                    onClose={() => setShowScaffolding(false)}
                />
            )}

            {gradeResult && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <div className={`text-5xl font-black mb-2 ${gradeResult.isPassed ? 'text-green-500' : 'text-orange-500'}`}>
                                {(gradeResult.score * 100).toFixed(0)}%
                            </div>
                            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold">
                                {gradeResult.isPassed ? 'Excellent! Task Completed' : 'Keep Going! Almost There'}
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 max-h-48 overflow-y-auto border border-slate-700/50">
                            <h4 className="text-white text-xs font-bold mb-3 uppercase opacity-50">Kekurangan Diagram:</h4>
                            <ul className="space-y-2">
                                {gradeResult.feedbacks.length > 0 ? (
                                    gradeResult.feedbacks.map((f, i) => (
                                        <li key={i} className="text-[13px] text-slate-300 flex gap-2">
                                            <span className="text-orange-500">•</span> {f}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-green-400 text-sm">Semua sudah sesuai!</li>
                                )}
                            </ul>
                        </div>

                        {gradeResult.isPassed ? (
                            <button
                                onClick={() => {
                                    setGradeResult(null);
                                    setActiveTab("code");
                                }}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-2"
                            >
                                <Unlock className="w-4 h-4 animate-bounce" />
                                <span>Unlock & Start Coding</span>
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setGradeResult(null)}
                                    className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => window.location.href = '/student'} // Atau navigasi lain
                                    className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                                >
                                    Give Up
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>


    );

}


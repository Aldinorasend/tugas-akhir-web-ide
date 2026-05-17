"use client";

import DiagramCanvas from "@/components/diagram/DiagramCanvas";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import { getRandomStudyCase, getStudyCaseById, compareCode } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shuffle, Lock, Unlock, Sparkles, Timer } from "lucide-react";
import ProjectExplorer from "@/components/ProjectExplorer";
import JavaEditor from "@/components/JavaEditor";
import OutputPanel from "@/components/OutputPanel";
import { useSocket } from "@/hooks/useWebsocket";
import { graderDiagram, } from "@/lib/api";
import { useWorkspace } from "@/hooks/useWorkspace";
import { randomUUID } from "crypto";

export default function StudentDiagramPage() {
    const [gradeResult, setGradeResult] = useState<{
        score: number,
        feedbacks: string[],
        isPassed: boolean,
        studentCategory: string,
        reason: string,
    } | null>(null);
    const [stage, setStage] = useState<1 | 2 | 3>(3);
    const [studyCase, setStudyCase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nim, setNim] = useState("");
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [studentCategory, setStudentCategory] = useState<string>("");

    // Multiple tabs UI state
    const [activeTab, setActiveTab] = useState<"diagram" | "code">("diagram");
    const [isIdeUnlocked, setIsIdeUnlocked] = useState(true);
    const [showScaffolding, setShowScaffolding] = useState(false);

    // Coding Phase Analytics Metrics state
    const [codeMetrics, setCodeMetrics] = useState({
        temporal: {
            time_spent_ms: 0,
            idle_time_ms: 0,
            max_single_idle_ms: 0,
        },
        spatial_textual: {
            keystroke_count: 0,
            lines_of_code: 0,
        },
        spatial_churn: {
            total_actions: 0,
            add_count: 0,
            delete_count: 0,
        },
        evaluation: {
            submit_count: 0,
            mismatch_attempts: 0,
            run_count: 0,
        }
    });

    const lastCodeLengthRef = useRef<number>(0);
    const lastCodeActivityRef = useRef<number>(Date.now());
    const codeCurrentIdleRef = useRef<number>(0);
    const codeMaxIdleRef = useRef<number>(0);
    const codeAccumulatedIdleRef = useRef<number>(0);
    const codeStartTimeRef = useRef<number>(Date.now());

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
    const handleRun = async () => {
        runJavaCode(nodes, selectedId, flattenFiles);
        logCodeActivity();
        setCodeMetrics((prev) => ({
            ...prev,
            evaluation: {
                ...prev.evaluation,
                run_count: (prev.evaluation?.run_count || 0) + 1
            }
        }));
    };

    // Initialize or reset coding start time when coding tab becomes active
    useEffect(() => {
        if (activeTab === "code") {
            codeStartTimeRef.current = Date.now();
            lastCodeActivityRef.current = Date.now();
            codeCurrentIdleRef.current = 0;
            codeMaxIdleRef.current = 0;
            codeAccumulatedIdleRef.current = 0;
        }
    }, [activeTab]);

    // Timer for coding phase analytics
    useEffect(() => {
        const timer = setInterval(() => {
            if (activeTab !== "code") return;
            const now = Date.now();
            const totalTimeSpent = now - codeStartTimeRef.current;
            const timeSinceLastActivity = now - lastCodeActivityRef.current;

            if (timeSinceLastActivity >= 5000) {
                codeCurrentIdleRef.current = timeSinceLastActivity;
                if (codeCurrentIdleRef.current > codeMaxIdleRef.current) {
                    codeMaxIdleRef.current = codeCurrentIdleRef.current;
                }
            }

            setCodeMetrics((prev) => ({
                ...prev,
                temporal: {
                    time_spent_ms: totalTimeSpent,
                    idle_time_ms: codeAccumulatedIdleRef.current + codeCurrentIdleRef.current,
                    max_single_idle_ms: codeMaxIdleRef.current,
                }
            }));
        }, 1000);

        return () => clearInterval(timer);
    }, [activeTab]);

    useEffect(() => {
        if (currentFile) {
            lastCodeLengthRef.current = currentFile.content?.length || 0;
        }
    }, [selectedId, currentFile]);

    const logCodeActivity = () => {
        if (codeCurrentIdleRef.current > 0) {
            codeAccumulatedIdleRef.current += codeCurrentIdleRef.current;
            codeCurrentIdleRef.current = 0;
        }
        lastCodeActivityRef.current = Date.now();
    };

    const trackCodeAction = (actionType: "add_count" | "delete_count") => {
        logCodeActivity();
        setCodeMetrics((prev) => {
            const updatedChurn = { ...prev.spatial_churn };
            updatedChurn.total_actions += 1;
            if (actionType === "add_count") {
                updatedChurn.add_count += 1;
            } else if (actionType === "delete_count") {
                updatedChurn.delete_count += 1;
            }

            // Calculate dynamic total lines of code across all active Java files
            const allFiles = flattenFiles(nodes).filter(file => file.path.endsWith('.java'));
            const totalLines = allFiles.reduce((acc, file) => {
                return acc + (file.content ? file.content.split('\n').length : 0);
            }, 0);

            return {
                ...prev,
                spatial_churn: updatedChurn,
                spatial_textual: {
                    keystroke_count: (prev.spatial_textual?.keystroke_count || 0) + 1,
                    lines_of_code: totalLines
                }
            };
        });
    };

    const handleCodeChangeWithMetrics = (newCode: string | undefined) => {
        handleCodeChange(newCode);
        if (newCode === undefined) return;

        const oldLength = lastCodeLengthRef.current;
        const newLength = newCode.length;

        if (newLength > oldLength) {
            trackCodeAction("add_count");
        } else if (newLength < oldLength) {
            trackCodeAction("delete_count");
        }

        lastCodeLengthRef.current = newLength;
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

    const handleSubmitDiagram = async () => {
        if (!diagramRef.current) return;

        // 1. Ambil snapshot metrik dan struktur UML dari ref canvas
        const currentMetrics = diagramRef.current.getMetrics();
        const snapshotUML = diagramRef.current.getSnapshot();

        // 2. Force increment lokal untuk submit_count agar data ke backend tidak telat
        const updatedMetricsForBackend = {
            ...currentMetrics,
            evaluation: {
                submit_count: (currentMetrics?.evaluation?.submit_count || 0) + 1,
                mismatch_attempts: currentMetrics?.evaluation?.mismatch_attempts || 0
            }
        };

        if (!snapshotUML || !nim) return alert("Isi NIM dan lengkapi diagram!");

        setIsSubmitting(true);
        try {
            // 3. Tembak fungsi API Grader bawaan kamu
            const result = await graderDiagram(
                "90289652-6cf9-41a2-a106-ec1783c5146e", // Sesuai user_id valid kamu
                studyCase.answer_key.exercise_id,
                snapshotUML.nodes,
                snapshotUML.edges,
                updatedMetricsForBackend
            );

            console.log("Grader result:", result);

            if (result && result.success) {
                // 4. Sinkronisasikan balik jumlah attempt/mismatch ke state internal hook useDiagram
                // Ini agar counter internal di hook tahu status kelulusan submisi ini
                diagramRef.current.logSubmitResult(result.isPassed);

                // 5. MECHANISM RESET TIMEOUT UNTUK STOPPERS (Fading Trigger)
                if (result.scaffolding?.shouldResetIdle) {
                    diagramRef.current.clearHistoricalIdleTime?.();
                    console.log("Historical idle time trap flushed successfully.");
                }

                // Munculkan modal hasil evaluasi
                setGradeResult({
                    score: result.score / 100, // Normalized to 0-1
                    feedbacks: result.hints || [],
                    reason: result.scaffolding.reason || "",
                    isPassed: result.isPassed,
                    studentCategory: result.analytics.category,
                });

                // 6. ADAPTIVE UI TRIGGER (Bahan analisis Bab 4 skripsi kamu)
                if (result.isPassed) {
                    setIsIdeUnlocked(true);
                } else {
                    // Kondisikan tampilan UI berdasarkan level bantuan yang diberikan oleh server
                    console.log(`Mahasiswa diarahkan ke Scaffolding Level: ${result.scaffolding?.level}`);
                    if (result.scaffolding?.level) {
                        setStage(result.scaffolding.level as 1 | 2 | 3);
                        setShowScaffolding(true);
                        if (result.scaffolding.level === 1) triggerStage1Injection();
                    }
                }
            }

        } catch (error) {
            console.error("Error grading:", error);
            alert("Gagal mengirim jawaban. Coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitCode = async () => {
        const allFiles = flattenFiles(nodes).filter(file => file.path.endsWith('.java'));

        if (allFiles.length === 0) return alert("Tidak ada kode Java!");

        // Force increment submit_count
        const updatedMetrics = {
            ...codeMetrics,
            evaluation: {
                ...codeMetrics.evaluation,
                submit_count: (codeMetrics.evaluation?.submit_count || 0) + 1,
                mismatch_attempts: codeMetrics.evaluation?.mismatch_attempts || 0
            }
        };


        setIsSubmitting(true);
        try {
            const result = await compareCode(
                "90289652-6cf9-41a2-a106-ec1783c5146e",
                studyCase.id || studyCase.answer_key.exercise_id,
                allFiles,
                updatedMetrics,
                studyCase.answer_key.logic_rules
            );
            console.log("Result:", result);

            if (result && result.success) {
                // Update internal metrics matching
                setCodeMetrics(prev => ({
                    ...prev,

                }));

                // Reset timeout trapping for Stoppers
                if (result.scaffolding?.shouldResetIdle) {
                    codeAccumulatedIdleRef.current = 0;
                    codeCurrentIdleRef.current = 0;
                    codeMaxIdleRef.current = 0;
                    lastCodeActivityRef.current = Date.now();
                }

                setGradeResult({
                    score: result.score,
                    feedbacks: result.hints || [],
                    reason: result.scaffolding?.reason || "",
                    isPassed: result.isPassed,
                    studentCategory: result.analytics?.category || "",
                });

                if (result.isPassed) {
                    alert("Selamat! Kode Java Anda berhasil 100% lolos verifikasi logika kelas!");
                } else {
                    console.log(`Mahasiswa diarahkan ke Scaffolding Level Koding: ${result.scaffolding?.level}`);
                    if (result.scaffolding?.level) {
                        setStage(result.scaffolding.level as 1 | 2 | 3);
                        setShowScaffolding(true);
                    }
                }
            }
        } catch (error: any) {
            console.error("Test Matcher Error:", error);
            alert("Gagal mengirim kode Java. Coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    }




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

                {activeTab === "diagram" ? (
                    <button onClick={handleSubmitDiagram} disabled={isSubmitting} className="w-full py-3 bg-green-600 rounded-xl font-bold">
                        {isSubmitting ? "Grading..." : "Submit Diagram"}
                    </button>
                ) : (
                    <button onClick={handleSubmitCode} disabled={isSubmitting} className="w-full py-3 bg-green-600 rounded-xl font-bold">
                        Submit Code
                    </button>
                )}

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
                            {/* <span className="text-sm font-mono font-bold text-white tabular-nums">
                                {formatTime(timeElapsed)}
                            </span> */}
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
                                            onCodeChange={handleCodeChangeWithMetrics}
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
                    feedbacks={gradeResult?.feedbacks || []}
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
                            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold">
                                Kategori: {gradeResult.studentCategory}
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 max-h-48 overflow-y-auto border border-slate-700/50">
                            <h4 className="text-white text-xs font-bold mb-3 uppercase opacity-50">Kekurangan Diagram:</h4>
                            <p className="text-white text-xs">{gradeResult.reason}</p>
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


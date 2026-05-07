"use client";

import DiagramCanvas from "@/components/diagram/DiagramCanvas";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import { getRandomStudyCase, getStudyCaseById } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { gradeDiagram } from "@/lib/grader";
import { supabase } from "@/lib/supabase";

export default function StudentDiagramPage() {
    const [gradeResult, setGradeResult] = useState<{ score: number, feedbacks: string[], isPassed: boolean } | null>(null);
    const [stage, setStage] = useState<1 | 2 | 3>(3);
    const [studyCase, setStudyCase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nim, setNim] = useState("");


    const diagramRef = useRef<any>(null); // Ref to the canvas
    const searchParams = useSearchParams();

    // Loading the Study Case
    const loadCase = async () => {
        setLoading(true)
        try {
            const id = searchParams.get("id");

            if (id) {
                const data = await getStudyCaseById(id);
                setStudyCase(data);
            } else {
                const data = await getRandomStudyCase();
                if (data) {
                    setStudyCase(data);
                    const params = new URLSearchParams(window.location.search);
                    params.set("id", data.id);
                    window.history.pushState(null, "", `?${params.toString()}`);
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
        const result = gradeDiagram(studyCase.answer_key, studentData);
        setGradeResult(result); // Simpan hasil untuk overlay

        // Simpan ke Supabase tetap berjalan di background
        try {
            await supabase.from('submissions').insert([{
                study_case_id: studyCase.id,
                content: studentData,
                score: result.score,
                passed: result.isPassed,
                student_id: nim,
                nim: nim
            }]);
        } catch (err) {
            console.error(err);
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
                <div className=" border-dashed p-3 border border-blue-600 rounded-lg mb-6 items-center">
                    <h1 className="text-center font-bold text-white text-xl">Study Case </h1>
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

            <div className="flex-1 h-full relative">
                <DiagramCanvas ref={diagramRef} />
            </div>

            <ScaffoldingPanel
                stage={stage}
                answerKey={studyCase?.answer_key}
                diagramRef={diagramRef}
            />

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
                    </div>
                </div>
            )}
        </main>


    );

}


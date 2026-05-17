"use client";

import { useEffect, useState } from "react";
import {
  X, Sparkles, Terminal, Code, Info, Heart,
  HelpCircle, Milestone, Lightbulb, BookOpen, Layers
} from "lucide-react";

interface DiagramNode {
  id: string;
  data: {
    name: string;
    attributes?: any[];
    methods?: any[];
  };
}

export default function ScaffoldingPanel({ stage, activeTab, answerKey, diagramRef, feedbacks = [], onClose }: any) {
  const [currentNodes, setCurrentNodes] = useState<DiagramNode[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (diagramRef?.current) {
        const snapshot = diagramRef.current.getSnapshot();
        if (snapshot) setCurrentNodes(snapshot.nodes || []);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [diagramRef]);

  const getRandomEncouragement = () => {
    const quotes = [
      "Ambil napas dalam-dalam. Mari fokus selangkah demi selangkah. Anda pasti bisa menyelesaikannya!",
      "Setiap arsitek perangkat lunak hebat pernah berada di posisi Anda. Kesalahan adalah bagian dari progress.",
      "Coba pecah masalah besar menjadi modul-modul kecil. Mari buat satu Class terlebih dahulu.",
      "Merancang UML adalah seni menstrukturkan logika. Nikmati prosesnya, Anda sedang melatih otak arsitek Anda!"
    ];
    return quotes[Math.floor(Date.now() / 10000) % quotes.length];
  };

  return (
    <div className="w-80 h-full border-l border-slate-800 bg-[#0f172a] flex flex-col shadow-2xl">
      {/* Header with Close Button */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400" />
          <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Support Panel</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "diagram" ? (
          <div className="space-y-6">
            {stage === 3 && (
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-rose-400" /> Stage 3: Affective Support
                </h2>

                {/* Encouragement Card */}
                <div className="relative overflow-hidden bg-slate-900 p-5 rounded-2xl border border-rose-500/20 shadow-lg">
                  <p className="text-[13px] text-rose-200 font-medium italic leading-relaxed mb-3">
                    "{getRandomEncouragement()}"
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                    Merancang perangkat lunak adalah proses iteratif. Tidak masalah jika diagram Anda belum sempurna pada percobaan pertama. Mari fokus satu demi satu langkah!
                  </p>
                </div>
              </div>
            )}

            {stage === 2 && (
              <div className="space-y-6">
                <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" /> Stage 2: Metacognitive Guided Support
                </h2>

                {/* Dynamic Metacognitive Prompts based on Feedbacks */}
                {feedbacks && feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    <section className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 shadow-inner">
                      <h3 className="text-[10px] font-bold text-blue-300 mb-3 uppercase tracking-tighter opacity-70 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" /> Pertanyaan Reflektif Evaluasi:
                      </h3>
                      <div className="space-y-3">
                        {feedbacks.map((f: string, i: number) => {
                          const cleanF = f.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
                          let reflectivePrompt = cleanF;
                          const fLower = cleanF.toLowerCase();
                          if (fLower.includes("belum ditemukan") || fLower.includes("missing class")) {
                            reflectivePrompt = `Coba telaah kembali deskripsi: Apakah ada entitas penting yang terlewat dan belum Anda buatkan Class Box-nya di kanvas?`;
                          } else if (fLower.includes("tipe hubungan") || fLower.includes("relasi antara")) {
                            reflectivePrompt = `Perhatikan hubungan antar objek. Apakah relasi tersebut bersifat pewarisan sifat ('is-a' / extends), pemenuhan kontrak ('implements'), atau kepemilikan data ('has-a')?`;
                          } else if (fLower.includes("atribut") || fLower.includes("attribute")) {
                            reflectivePrompt = `Mari cek pembungkusan data (Encapsulation). Apakah semua variabel di kelas tersebut sudah memiliki tipe data yang tepat serta tingkat visibilitas (private/public) yang sesuai?`;
                          } else if (fLower.includes("method")) {
                            reflectivePrompt = `Pikirkan tentang perilaku objek tersebut. Apakah method yang diminta sudah memiliki return type dan daftar parameter yang logis sesuai deskripsi studi kasus?`;
                          }
                          return (
                            <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80 flex flex-col gap-1.5">
                              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Deteksi Masalah #{i + 1}:
                              </span>
                              <p className="text-xs text-slate-300 italic">"{cleanF}"</p>
                              <div className="mt-1 pt-1.5 border-t border-slate-800/50 flex gap-2">
                                <span className="text-blue-400 font-bold text-xs">Tanya Dirimu:</span>
                                <p className="text-xs text-blue-200 font-medium leading-relaxed">{reflectivePrompt}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <section className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 shadow-inner">
                      <h3 className="text-[10px] font-bold text-blue-300 mb-3 uppercase tracking-tighter opacity-70 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" /> Panduan Berpikir Mandiri:
                      </h3>
                      <ul className="text-[13px] text-slate-400 space-y-3.5 leading-relaxed">
                        {currentNodes.length === 0 ? (
                          <li className="flex gap-2">
                            <span className="text-blue-500">•</span>
                            <span>"Kenapa Anda belum mulai menggambar kotak Kelas? Apakah ada istilah dalam deskripsi studi kasus yang membingungkan?"</span>
                          </li>
                        ) : (
                          <>
                            <li className="flex gap-2">
                              <span className="text-blue-500">•</span>
                              <span>"Anda telah menggambar {currentNodes.length} kelas. Apakah struktur relasi antar kelas tersebut sudah membentuk hierarki 'is-a' (inheritance) atau 'has-a' (association)?"</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-blue-500">•</span>
                              <span>"Coba analisis kelas <strong>{currentNodes[0]?.data?.name || 'Pertama'}</strong>. Apakah kelas ini memiliki terlalu banyak tanggung jawab? Ingat prinsip Single Responsibility!"</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </section>
                  </div>
                )}

                {/* Refleksi Arsitektur: Abstract vs Interface */}
                <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                  <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Refleksi: Abstract vs Interface
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                    Masih ragu membedakan kapan menggunakan Kelas Abstrak atau Interface pada Studi Kasus Anda? Tanyakan ini pada analisis Anda:
                  </p>
                  <div className="space-y-2 pt-0.5">
                    <div className="bg-slate-900/40 p-2.5 rounded border border-slate-800/80">
                      <strong className="text-[9px] text-amber-400 uppercase tracking-wider block mb-0.5 font-bold">Kelas Abstrak (Abstract Class)</strong>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                        Apakah entitas-entitas tersebut berkerabat erat ("is-a") dan perlu mewarisi atribut / variabel keadaan yang sama? Jika ya, gunakan Kelas Abstrak.
                      </p>
                    </div>
                    <div className="bg-slate-900/40 p-2.5 rounded border border-slate-800/80">
                      <strong className="text-[9px] text-purple-400 uppercase tracking-wider block mb-0.5 font-bold">Interface</strong>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                        Apakah Anda hanya ingin menetapkan kontrak perilaku ("can-do") tanpa membagikan variabel? Jika kelas-kelas tersebut hanya berbagi fungsi yang sama, gunakan Interface.
                      </p>
                    </div>
                  </div>
                </div>

                <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                  <h3 className="text-[10px] font-bold text-slate-300 mb-3 uppercase tracking-tighter opacity-70 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Strategic Checklist:
                  </h3>
                  <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                    <p>Sebelum mengirim jawaban, tanyakan ini pada diri Anda:</p>
                    <div className="flex gap-2 items-start">
                      <input type="checkbox" className="mt-1 accent-blue-500" readOnly checked={currentNodes.some(n => n.data?.attributes?.length && n.data?.attributes?.length > 0)} />
                      <span>Apakah seluruh atribut penting (variabel anggota) sudah terdaftar?</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <input type="checkbox" className="mt-1 accent-blue-500" readOnly checked={currentNodes.some(n => n.data?.methods?.length && n.data?.methods?.length > 0)} />
                      <span>Apakah fungsi-fungsi kritis (methods) sudah dideklarasikan beserta tipe kembaliannya?</span>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {stage === 1 && (
              <div className="space-y-6">
                <h2 className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                  <Code className="w-3.5 h-3.5" /> Stage 1: Cognitive Directive Support
                </h2>

                {/* Active Skeleton Badge */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 shadow-md relative overflow-hidden">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Skeleton Mode Active
                  </span>
                  <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                    Struktur kerangka dasar UML telah otomatis kami injeksikan ke dalam kanvas Anda.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Fokus utama Anda sekarang adalah melengkapi isi kotak-kotak kelas tersebut (atribut dan method) serta menghubungkannya dengan relasi yang tepat.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {stage === 3 && (
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-rose-500" /> Stage 3: Affective Support (Coding)
                </h2>

                {/* Encouragement Card */}
                <div className="relative overflow-hidden bg-slate-900 p-5 rounded-2xl border border-rose-500/20 shadow-lg">
                  <p className="text-[13px] text-rose-200 font-medium italic leading-relaxed mb-3">
                    "{getRandomEncouragement()}"
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                    Menghadapi error kompilasi atau ketidaksesuaian logika adalah hal yang biasa dalam dunia pemrograman. Jangan berkecil hati, mari kita bedah perlahan!
                  </p>
                </div>
              </div>
            )}

            {stage === 2 && (
              <div className="space-y-6">
                <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" /> Stage 2: Metacognitive Guided Support (Coding)
                </h2>

                {/* Dynamic Metacognitive Prompts based on Feedbacks */}
                {feedbacks && feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    <section className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 shadow-inner">
                      <h3 className="text-[10px] font-bold text-blue-300 mb-3 uppercase tracking-tighter opacity-70 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" /> Pertanyaan Reflektif Kode:
                      </h3>
                      <div className="space-y-3">
                        {feedbacks.map((f: string, i: number) => {
                          const cleanF = f.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
                          const isMatch = cleanF.startsWith("✅") || f.startsWith("✅");
                          let reflectivePrompt = cleanF;
                          const fLower = cleanF.toLowerCase();

                          if (isMatch) {
                            reflectivePrompt = "Sempurna! Bagian kode ini sudah berhasil dikonstruksi secara tepat sesuai diagram.";
                          } else {
                            if (fLower.includes("extends") || fLower.includes("implements") || fLower.includes("inheritance") || fLower.includes("relasi")) {
                              reflectivePrompt = "Coba pikirkan pewarisan sifat: Apakah public class Anda sudah mewarisi kelas induk menggunakan kata kunci 'extends' or 'implements'?";
                            } else if (fLower.includes("method") || fLower.includes("fungsi")) {
                              reflectivePrompt = "Periksa deklarasi method: Apakah parameter (jumlah & tipe data) serta return type method tersebut sudah sama dengan rancangan diagram?";
                            } else if (fLower.includes("class") || fLower.includes("kelas")) {
                              reflectivePrompt = "Periksa nama public class: Apakah ejaan dan besar-kecil hurufnya sudah persis sama dengan nama file Java tempat ia ditulis?";
                            } else if (fLower.includes("rule") || fLower.includes("logic") || fLower.includes("logika")) {
                              reflectivePrompt = "Coba bedah aturan logika: Apakah terdapat kondisi pencabangan (if-else) atau inisialisasi variabel anggota yang terlewat?";
                            } else {
                              reflectivePrompt = "Bandingkan struktur kode Anda dengan spesifikasi UML di atas. Apakah ada komponen yang belum sinkron?";
                            }
                          }

                          return (
                            <div key={i} className={`p-3 rounded-lg border flex flex-col gap-1.5 ${isMatch ? "bg-emerald-500/5 border-emerald-500/10" : "bg-slate-900/50 border-slate-800/80"}`}>
                              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isMatch ? "bg-emerald-500" : "bg-orange-500"}`} />
                                {isMatch ? "Status Lolos" : "Verifikasi Masalah"} #{i + 1}:
                              </span>
                              <p className="text-xs text-slate-300 font-medium">{cleanF}</p>
                              {!isMatch && (
                                <div className="mt-1 pt-1.5 border-t border-slate-800/50 flex gap-2">
                                  <span className="text-blue-400 font-bold text-xs shrink-0">Refleksi:</span>
                                  <p className="text-xs text-blue-200 font-medium leading-relaxed">{reflectivePrompt}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <section className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 shadow-inner">
                      <h3 className="text-[10px] font-bold text-blue-300 mb-3 uppercase tracking-tighter opacity-70 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" /> Panduan Berpikir Mandiri:
                      </h3>
                      <ul className="text-[13px] text-slate-400 space-y-3.5 leading-relaxed font-medium">
                        <li className="flex gap-2">
                          <span className="text-blue-500">•</span>
                          <span>"Apakah Anda sudah mendeklarasikan package dan mengimpor pustaka pendukung yang diperlukan di awal file?"</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-500">•</span>
                          <span>"Coba jalankan (Run) kode secara berkala untuk memverifikasi apakah ada error sintaksis sebelum mengecek kecocokan logika kelas."</span>
                        </li>
                      </ul>
                    </section>
                  </div>
                )}

                <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                  <h3 className="text-[10px] font-bold text-slate-300 mb-3 uppercase tracking-tighter opacity-70 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Checklist Metakognitif Koding:
                  </h3>
                  <div className="text-xs text-slate-400 space-y-2.5 leading-relaxed">
                    <p>Sebelum mengirimkan kode ke server, lakukan verifikasi mandiri berikut:</p>
                    <div className="flex gap-2 items-start">
                      <input type="checkbox" className="mt-1 accent-blue-500" readOnly checked={feedbacks.length > 0 && feedbacks.every((f: any) => f.startsWith("✅"))} />
                      <span>Semua method sudah diimplementasikan dengan struktur return yang valid.</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <input type="checkbox" className="mt-1 accent-blue-500" readOnly checked={feedbacks.length > 0} />
                      <span>Hubungan Pewarisan (Inheritance/extends) sudah sesuai spesifikasi kasus.</span>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {stage === 1 && (
              <div className="space-y-6">
                <h2 className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                  <Code className="w-3.5 h-3.5" /> Stage 1: Cognitive Directive Support (Coding)
                </h2>

                {/* Directive skeleton banner */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 shadow-md relative overflow-hidden">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Code Template Blueprint
                  </span>
                  <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                    Gunakan panduan kerangka cetak biru kelas Java di bawah ini untuk menulis kode Anda secara terstruktur.
                  </p>
                </div>

                {/* Direct Blueprint Checklist */}
                {answerKey && (
                  <section className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 shadow-inner space-y-3.5">
                    <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter opacity-70 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Struktur Kelas Java yang Diminta:
                    </h3>
                    <div className="space-y-4">
                      {answerKey.nodes && answerKey.nodes.map((node: any, idx: number) => {
                        const isAbstract = node.data?.isAbstract;
                        const isInterface = node.data?.isInterface;
                        const stereotypeLabel = isInterface ? "interface" : isAbstract ? "abstract class" : "class";
                        return (
                          <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <Layers className="w-3 h-3 text-slate-400" />
                                {stereotypeLabel} {node.data?.name}
                              </span>
                            </div>

                            {/* Attributes */}
                            {node.data?.attributes && node.data.attributes.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider font-sans">Variables / Fields:</span>
                                <ul className="text-slate-300 space-y-0.5 pl-2">
                                  {node.data.attributes.map((attr: any, aIdx: number) => (
                                    <li key={aIdx} className="flex gap-1">
                                      <span className="text-emerald-500/80">{attr.access}</span>
                                      <span>{attr.type}</span>
                                      <span className="text-slate-200">{attr.name};</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Methods */}
                            {node.data?.methods && node.data.methods.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider font-sans">Methods:</span>
                                <ul className="text-slate-300 space-y-1.5 pl-2">
                                  {node.data.methods.map((meth: any, mIdx: number) => (
                                    <li key={mIdx} className="flex flex-col">
                                      <div className="flex gap-1">
                                        <span className="text-emerald-500/80">{meth.access}</span>
                                        {isAbstract && !isInterface && <span className="text-purple-400">abstract</span>}
                                        <span>{meth.type}</span>
                                        <span className="text-slate-200">{meth.name}()</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface DiagramNode {
  id: string;
  data: {
    name: string;
    attributes?: any[];
    methods?: any[];
  };
}

export default function ScaffoldingPanel({ stage, activeTab, answerKey, diagramRef, feedbacks = [], onClose, isNonScaffolding = false }: any) {
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

  if (isNonScaffolding) {
    return (
      <div className="w-80 h-full border-l border-slate-800 bg-[#0f172a] flex flex-col font-sans">
        {/* Header with Close Button */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-300">Help Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "diagram" ? (
            <div className="space-y-4">
              {/* Generic UML Help */}
              <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200">
                  Panduan Umum Diagram
                </h3>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
                  <li>Klik tombol <strong className="text-slate-300 font-medium">"Add Class"</strong> untuk membuat kotak kelas baru.</li>
                  <li>Klik dua kali pada nama kelas, nama atribut, atau nama method untuk mengeditnya secara langsung.</li>
                  <li>Tarik garis dari port/titik lingkaran satu kelas ke kelas lainnya untuk menghubungkan relasi.</li>
                  <li>Tentukan tipe kelas (Class biasa, Abstract Class, atau Interface) di bagian bawah kotak kelas.</li>
                  <li>Klik tombol <strong className="text-slate-300 font-medium">"Check Diagram"</strong> di pojok kanan atas untuk mengecek kebenaran.</li>
                </ul>
              </section>

              {/* Clueless Support */}
              <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-slate-200">
                  Bantuan Pemecahan Masalah
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Jika Anda merasa bingung atau menemui jalan buntu dalam merancang diagram kelas, harap membaca kembali deskripsi studi kasus yang diberikan dengan saksama.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rancanglah kelas-kelas beserta atribut dan metodenya secara bertahap sesuai informasi yang tertulis di dalam teks studi kasus.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Generic Java Coding Help */}
              <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200">
                  Panduan Pemrograman Java
                </h3>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
                  <li>Gunakan panel penjelajah berkas di sisi kiri untuk membuka dan mengedit berkas Java yang diperlukan.</li>
                  <li>Tulis kode program Java yang valid dan sesuai dengan rancangan kelas yang telah Anda buat di tab diagram.</li>
                  <li>Klik tombol <strong className="text-slate-300 font-medium">"Run Code"</strong> untuk mengompilasi dan mengeksekusi program Anda.</li>
                  <li>Periksa hasil keluaran program atau pesan kesalahan (*error compiler*) pada panel output di bagian bawah.</li>
                </ul>
              </section>

              {/* Clueless Support */}
              <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-slate-200">
                  Bantuan Pemecahan Masalah
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Apabila program Anda mengalami kegagalan kompilasi atau hasil keluaran belum sesuai, periksalah pesan error yang tertera pada panel output di bawah editor.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pastikan struktur deklarasi kelas, nama berkas, tipe data, serta kata kunci pewarisan (*extends* / *implements*) telah ditulis dengan benar.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    );
  }

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
    <div className="w-80 h-full border-l border-slate-800 bg-[#0f172a] flex flex-col font-sans">
      {/* Header with Close Button */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-300">Support Panel</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "diagram" ? (
          <div className="space-y-4">
            {stage === 3 && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-200">
                  Stage 3: Affective Support
                </h2>

                {/* Encouragement Card */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "{getRandomEncouragement()}"
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Merancang perangkat lunak adalah proses iteratif. Tidak masalah jika diagram Anda belum sempurna pada percobaan pertama. Mari fokus satu demi satu langkah!
                  </p>
                </div>
              </div>
            )}

            {stage === 2 && (
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-slate-200">
                  Stage 2: Metacognitive Guided Support
                </h2>

                {/* Dynamic Metacognitive Prompts based on Feedbacks */}
                {feedbacks && feedbacks.length > 0 ? (
                  <div className="space-y-3">
                    <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-300 mb-1">
                        Pertanyaan Reflektif Evaluasi:
                      </h3>
                      <div className="space-y-2.5">
                        {feedbacks.map((f: string, i: number) => {
                          const cleanF = f.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
                          let reflectivePrompt = cleanF;
                          const fLower = cleanF.toLowerCase();
                          if (fLower.includes("belum ditemukan") || fLower.includes("missing class")) {
                            reflectivePrompt = `Coba telaah kembali deskripsi: Apakah ada entitas penting yang terlewat dan belum Anda buatkan Class Box-nya di kanvas?`;
                          } else if (fLower.includes("tipe hubungan") || fLower.includes("relasi antara")) {
                            reflectivePrompt = `Perhatikan hubungan antar objek. Apakah relasi tersebut bersifat pewarisan sifat ('is-a' / extends / inheritance) atau pemenuhan kontrak ('implements' / interface)?`;
                          } else if (fLower.includes("atribut") || fLower.includes("attribute")) {
                            reflectivePrompt = `Mari cek pembungkusan data (Encapsulation). Apakah semua variabel di kelas tersebut sudah memiliki tipe data yang tepat serta tingkat visibilitas (private/public) yang sesuai?`;
                          } else if (fLower.includes("method")) {
                            reflectivePrompt = `Pikirkan tentang perilaku objek tersebut. Apakah method yang diminta sudah memiliki return type dan daftar parameter yang logis sesuai deskripsi studi kasus?`;
                          }
                          return (
                            <div key={i} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                              <span className="text-[11px] text-slate-400 font-semibold block">
                                Deteksi Masalah #{i + 1}:
                              </span>
                              <p className="text-xs text-slate-300">"{cleanF}"</p>
                              <div className="pt-2 border-t border-slate-800 flex flex-col gap-1">
                                <span className="text-blue-400 font-semibold text-xs">Tanya Dirimu:</span>
                                <p className="text-xs text-slate-300 leading-relaxed">{reflectivePrompt}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h3 className="text-xs font-semibold text-slate-300">
                        Panduan Berpikir Mandiri:
                      </h3>
                      <ul className="text-xs text-slate-400 space-y-2">
                        {currentNodes.length === 0 ? (
                          <li>
                            "Kenapa Anda belum mulai menggambar kotak Kelas? Apakah ada istilah dalam deskripsi studi kasus yang membingungkan?"
                          </li>
                        ) : (
                          <>
                            <li>
                              "Anda telah menggambar {currentNodes.length} kelas. Apakah struktur relasi antar kelas tersebut sudah membentuk hierarki pewarisan sifat 'is-a' (inheritance) atau pemenuhan kontrak (interface)?"
                            </li>
                            <li>
                              "Coba analisis kelas <strong>{currentNodes[0]?.data?.name || 'Pertama'}</strong>. Apakah kelas ini memiliki terlalu banyak tanggung jawab? Ingat prinsip Single Responsibility!"
                            </li>
                          </>
                        )}
                      </ul>
                    </section>
                  </div>
                )}

                {/* Refleksi Arsitektur: Abstract vs Interface */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-200">
                    Refleksi: Abstract vs Interface
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Masih ragu membedakan kapan menggunakan Kelas Abstrak atau Interface pada Studi Kasus Anda? Tanyakan ini pada analisis Anda:
                  </p>
                  <div className="space-y-2">
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                      <strong className="text-[10px] text-amber-400 block mb-1 font-semibold">Kelas Abstrak (Abstract Class)</strong>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Apakah entitas-entitas tersebut berkerabat erat ("is-a") dan perlu mewarisi atribut / variabel keadaan yang sama? Jika ya, gunakan Kelas Abstrak.
                      </p>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                      <strong className="text-[10px] text-purple-400 block mb-1 font-semibold">Interface</strong>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Apakah Anda hanya ingin menetapkan kontrak perilaku ("can-do") tanpa membagikan variabel? Jika kelas-kelas tersebut hanya berbagi fungsi yang sama, gunakan Interface.
                      </p>
                    </div>
                  </div>
                </div>

                <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-300">
                    Strategic Checklist:
                  </h3>
                  <div className="text-xs text-slate-400 space-y-2">
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
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-slate-200">
                  Stage 1: Cognitive Directive Support
                </h2>

                {/* Active Skeleton Badge */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-semibold text-emerald-400">
                    Skeleton Mode Active
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Struktur kerangka dasar UML telah otomatis kami injeksikan ke dalam kanvas Anda.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Fokus utama Anda sekarang adalah melengkapi isi kotak-kotak kelas tersebut (atribut dan method) serta menghubungkannya dengan relasi yang tepat.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {stage === 3 && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-200">
                  Stage 3: Affective Support (Coding)
                </h2>

                {/* Encouragement Card */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "{getRandomEncouragement()}"
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Menghadapi error kompilasi atau ketidaksesuaian logika adalah hal yang biasa dalam dunia pemrograman. Jangan berkecil hati, mari kita bedah perlahan!
                  </p>
                </div>
              </div>
            )}

            {stage === 2 && (
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-slate-200">
                  Stage 2: Metacognitive Guided Support (Coding)
                </h2>

                {/* Dynamic Metacognitive Prompts based on Feedbacks */}
                {feedbacks && feedbacks.length > 0 ? (
                  <div className="space-y-3">
                    <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-300 mb-1">
                        Pertanyaan Reflektif Kode:
                      </h3>
                      <div className="space-y-2.5">
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
                            <div key={i} className={`p-3 rounded-lg border space-y-2 ${isMatch ? "bg-emerald-950/20 border-emerald-800" : "bg-slate-900 border-slate-800"}`}>
                              <span className="text-[11px] text-slate-400 font-semibold block">
                                {isMatch ? "Status Lolos" : "Verifikasi Masalah"} #{i + 1}:
                              </span>
                              <p className="text-xs text-slate-300">{cleanF}</p>
                              {!isMatch && (
                                <div className="pt-2 border-t border-slate-800 flex flex-col gap-1">
                                  <span className="text-blue-400 font-semibold text-xs">Refleksi:</span>
                                  <p className="text-xs text-slate-300 leading-relaxed">{reflectivePrompt}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                      <h3 className="text-xs font-semibold text-slate-300">
                        Panduan Berpikir Mandiri:
                      </h3>
                      <ul className="text-xs text-slate-400 space-y-2">
                        <li>
                          "Apakah Anda sudah mendeklarasikan package dan mengimpor pustaka pendukung yang diperlukan di awal file?"
                        </li>
                        <li>
                          "Coba jalankan (Run) kode secara berkala untuk memverifikasi apakah ada error sintaksis sebelum mengecek kecocokan logika kelas."
                        </li>
                      </ul>
                    </section>
                  </div>
                )}

                {/* OOP Best Practice Reminder */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    💡 Refleksi Rancangan OOP:
                  </h3>
                  <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                    <p>
                      • Jika Anda memiliki atribut dengan modifier akses <code className="text-blue-300 font-mono text-[10px]">private</code>, mekanisme standar apa dalam pemrograman berorientasi objek yang sebaiknya disediakan agar kelas luar tetap dapat mengakses atau mengubah nilainya secara aman?
                    </p>
                    <p>
                      • Apabila sebuah kelas bertindak sebagai anak/turunan dari kelas induk (<code className="text-purple-300 font-mono text-[10px]">extends</code>), bagaimana cara kelas anak memastikan inisialisasi awal variabel milik kelas induk berjalan dengan tepat di dalam konstruktornya?
                    </p>
                  </div>
                </div>

                <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-300">
                    Checklist Metakognitif Koding:
                  </h3>
                  <div className="text-xs text-slate-400 space-y-2">
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
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-slate-200">
                  Stage 1: Cognitive Directive Support (Coding)
                </h2>

                {/* Custom Directive Alert for Level 1 Coding */}
                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex flex-col gap-1.5 shadow-lg shadow-amber-500/5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-sans">
                    💡 Petunjuk Penting Enkapsulasi & Pewarisan
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    jangan lupa untuk menambahkan setter getter jika private dan jangan lupa inisiasi keyword super
                  </p>
                </div>

                {/* Directive skeleton banner */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                  <span className="text-[10px] font-semibold text-emerald-400">
                    Code Blueprint
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Gunakan panduan kerangka cetak biru kelas Java di bawah ini untuk menulis kode Anda secara terstruktur.
                  </p>
                </div>

                {/* Direct Blueprint Checklist */}
                {answerKey && (
                  <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-350">
                      Struktur Kelas Java yang Diminta:
                    </h3>
                    <div className="space-y-3">
                      {answerKey.nodes && answerKey.nodes.map((node: any, idx: number) => {
                        const isAbstract = node.data?.isAbstract;
                        const isInterface = node.data?.isInterface;
                        const stereotypeLabel = isInterface ? "interface" : isAbstract ? "abstract class" : "class";
                        return (
                          <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="text-xs font-semibold text-emerald-400">
                                {stereotypeLabel} {node.data?.name}
                              </span>
                            </div>

                            {/* Attributes */}
                            {node.data?.attributes && node.data.attributes.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-semibold text-slate-500 font-sans">Variables / Fields:</span>
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
                                <span className="text-[10px] font-semibold text-slate-500 font-sans">Methods:</span>
                                <ul className="text-slate-300 space-y-1 pl-2">
                                  {node.data.methods.map((meth: any, mIdx: number) => (
                                    <li key={mIdx} className="flex flex-col">
                                      <div className="flex gap-1">
                                        <span className="text-emerald-500/80">{meth.access}</span>
                                        {isAbstract && !isInterface && <span className="text-purple-450">abstract</span>}
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
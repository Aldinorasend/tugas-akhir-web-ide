"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical, LayoutDashboard } from "lucide-react";
import UserBadge from "@/components/UserBadge";

export default function StudentRouteSelection() {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token) {
      router.push("/login");
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const isLecturer = user?.role === "lecturer";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center w-full mb-8">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-4">
            {user && <UserBadge />}
            {user && (
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors bg-rose-950/20 px-3 py-1.5 rounded border border-rose-900"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="text-center mb-8">
          {user && (
            <p className="text-blue-400 text-xs font-semibold mb-1">
              Selamat datang, {user.full_name || user.nim_nip}
            </p>
          )}
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLecturer ? "Portal Dosen" : "Pilih Mode Pembelajaran"}
          </h1>
          <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            {isLecturer
              ? "Silakan pilih menu di bawah ini untuk mengelola atau menguji study case."
              : "Silakan pilih salah satu kelompok/mode di bawah ini untuk memulai sesi pembelajaran."}
          </p>
        </div>

        {isLecturer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Uji Coba Study Case */}
            <Link href="/student/scaffolding" className="block group">
              <div className="h-full p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-all flex flex-col justify-between hover:bg-slate-900/80">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-900/50 flex items-center justify-center mb-4">
                    <FlaskConical className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    Uji Coba Study Case
                  </h2>
                  <span className="inline-block text-[9px] font-semibold bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900 mb-3">
                    Mode Mahasiswa
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Masuk ke workspace mahasiswa untuk mencoba study case dari sudut pandang mahasiswa — lengkap dengan diagram UML, IDE Java, dan scaffolding.
                  </p>
                </div>

                <div className="mt-6 text-xs font-semibold text-emerald-400 group-hover:underline">
                  Mulai Uji Coba →
                </div>
              </div>
            </Link>

            {/* Card 2: Dashboard Dosen */}
            <Link href="/lecturer/dashboard" className="block group">
              <div className="h-full p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-all flex flex-col justify-between hover:bg-slate-900/80">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-900/50 flex items-center justify-center mb-4">
                    <LayoutDashboard className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    Dashboard Dosen
                  </h2>
                  <span className="inline-block text-[9px] font-semibold bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-900 mb-3">
                    Mode Pengajar
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pantau progres belajar mahasiswa, lihat analitik kategori, skor, dan statistik pengerjaan untuk setiap study case.
                  </p>
                </div>

                <div className="mt-6 text-xs font-semibold text-blue-400 group-hover:underline">
                  Buka Dashboard →
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Route 1: Adaptive Scaffolding (Experimental Group) */}
            <Link href="/student/scaffolding" className="block group">
              <div className="h-full p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-all flex flex-col justify-between hover:bg-slate-900/80">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    Adaptive Scaffolding
                  </h2>
                  <span className="inline-block text-[9px] font-semibold bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-900 mb-3">
                    Kelompok Eksperimen
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Belajar dengan bantuan dukungan scaffolding adaptif yang memandu secara interaktif (Stage 1-3) berdasarkan deteksi kategori pengerjaan Anda.
                  </p>
                </div>

                <div className="mt-6 text-xs font-semibold text-blue-400 group-hover:underline">
                  Masuk Mode Eksperimen →
                </div>
              </div>
            </Link>

            {/* Route 2: Non-Scaffolding (Control Group) */}
            <Link href="/student/non-scaffolding" className="block group">
              <div className="h-full p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-all flex flex-col justify-between hover:bg-slate-900/80">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    Non-Scaffolding
                  </h2>
                  <span className="inline-block text-[9px] font-semibold bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 mb-3">
                    Kelompok Kontrol
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Belajar secara mandiri hanya dengan menggunakan bantuan petunjuk umum dan dokumentasi konvensional statis (tanpa panduan bertahap adaptif).
                  </p>
                </div>

                <div className="mt-6 text-xs font-semibold text-slate-400 group-hover:underline">
                  Masuk Mode Kontrol →
                </div>
              </div>
            </Link>
          </div>
        )}

        {!isLecturer && (
          <div className="mt-12 text-slate-650 text-[10px] text-center max-w-sm mx-auto">
            Pilihan ini disediakan untuk keperluan evaluasi A/B testing guna mengukur pengaruh efektivitas scaffolding adaptif.
          </div>
        )}
      </div>
    </div>
  );
}

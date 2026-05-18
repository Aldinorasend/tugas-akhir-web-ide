"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, PlusCircle, LogOut, Settings, BookOpen, ShieldAlert, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLecturer, setIsLecturer] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role === "lecturer") {
        setIsLecturer(true);
      } else {
        setIsLecturer(false);
      }
    } catch (err) {
      console.error("Auth error in lecturer layout:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navItems = [
    {
      label: "Study Cases",
      href: "/lecturer",
      icon: BookOpen,
      active: pathname === "/lecturer",
    },
    {
      label: "New Case",
      href: "/lecturer/new",
      icon: PlusCircle,
      active: pathname === "/lecturer/new",
    },
  ];

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold animate-pulse">Memverifikasi Hak Akses...</p>
      </div>
    );
  }

  if (!isLecturer) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/5 blur-[120px] rounded-full" />
        </div>

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative">
          <div className="bg-rose-500/10 p-4 rounded-2xl w-fit mx-auto mb-6 text-rose-400 border border-rose-500/20">
            <ShieldAlert size={40} className="animate-bounce" />
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-3">Akses Ditolak</h2>
          <p className="text-slate-400 text-xs leading-relaxed mb-8">
            Akun Anda terdaftar dengan role <span className="text-blue-400 font-mono font-bold">Student</span>. Halaman portal ini hanya diperuntukkan bagi dosen atau pengajar (<span className="text-orange-400 font-mono font-bold">Lecturer</span>).
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/student/select")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Buka Portal Mahasiswa <ArrowRight size={14} />
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
            >
              Keluar / Ganti Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020617] text-slate-300">
      {/* Mini Sidebar */}
      <aside className="w-20 h-full border-r border-slate-800 bg-[#020617] flex flex-col items-center py-8 gap-10 z-50">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <BookOpen className="text-white w-6 h-6" />
        </div>

        <nav className="flex flex-col gap-6 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative p-3 rounded-2xl transition-all duration-300",
                item.active
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
              )}
            >
              <item.icon className="w-6 h-6" />
              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700 shadow-xl">
                {item.label}
              </div>
              {/* Active Indicator */}
              {item.active && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              )}

            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-6">

          <button
            onClick={handleLogout}
            className="p-3 text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}

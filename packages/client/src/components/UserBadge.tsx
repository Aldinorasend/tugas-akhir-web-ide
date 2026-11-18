"use client";

import { useEffect, useState } from "react";

/**
 * Chip identitas sesi login (nama + NIM/NIP + role).
 * Membaca data user dari localStorage yang diisi saat login.
 * Tidak menampilkan apa-apa bila sesi belum ada.
 */
export default function UserBadge({ className = "" }: { className?: string }) {
  const [user, setUser] = useState<{ full_name?: string; nim_nip?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // sesi tidak valid: biarkan kosong, halaman utama yang menangani redirect
    }
  }, []);

  if (!user) return null;

  const roleLabel = user.role === "lecturer" ? "Dosen" : user.role === "student" ? "Mahasiswa" : user.role;

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <span
        className="w-6 h-6 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase"
        aria-hidden="true"
      >
        {(user.full_name || user.nim_nip || "?").charAt(0)}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-xs font-medium text-slate-200 truncate max-w-[12rem]">
          {user.full_name || user.nim_nip}
        </span>
        <span className="block text-[10px] text-slate-500 truncate max-w-[12rem]">
          {user.nim_nip}{user.nim_nip && roleLabel ? " · " : ""}{roleLabel}
        </span>
      </span>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL, apiFetch } from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [nimNip, setNimNip] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/student/select");
    }
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nimNip || !fullName || !password) {
      setError("Semua field wajib diisi!");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await apiFetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nim_nip: nimNip,
            password: password,
            full_name: fullName,
            role: role,
          }),
        },
        "Gagal melakukan registrasi"
      );

      if (!data.success) {
        throw new Error(data.message || "Gagal melakukan registrasi");
      }

      setSuccess("Registrasi berhasil! Mengalihkan ke halaman login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat registrasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-xl">
        <div className="text-center mb-6">
          <Link 
            href="/login" 
            className="inline-block text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors mb-4"
          >
            ← Kembali ke Login
          </Link>
          <h2 className="text-xl font-bold text-white mb-2">Daftar Akun</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Buat akun baru untuk mulai menggunakan sistem.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-900 text-red-400 text-xs rounded-md leading-relaxed">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-950/30 border border-emerald-900 text-emerald-400 text-xs rounded-md leading-relaxed">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">NIM / NIP</label>
            <input
              type="text"
              value={nimNip}
              onChange={(e) => setNimNip(e.target.value)}
              placeholder="NIM Anda"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white outline-none focus:border-slate-700 transition-colors font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white outline-none focus:border-slate-700 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white outline-none focus:border-slate-700 transition-colors"
            >
              <option value="student">Student (Mahasiswa)</option>
              <option value="lecturer">Lecturer (Dosen)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Password baru"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full mt-2 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:bg-blue-900 text-white text-xs font-bold rounded-md transition-colors shadow-md flex items-center justify-center"
          >
            {loading ? "Mendaftar..." : "Daftar Akun"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="text-blue-400 hover:underline font-semibold">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

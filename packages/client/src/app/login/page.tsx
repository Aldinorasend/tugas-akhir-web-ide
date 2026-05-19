"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [nimNip, setNimNip] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/student/select");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nimNip || !password) {
      setError("NIM dan Password harus diisi!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nim_nip: nimNip,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal login, periksa NIM/password Anda");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/student/select");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan pada server saat login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-xl">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-block text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors mb-4"
          >
            ← Kembali ke Beranda
          </Link>
          <h2 className="text-xl font-bold text-white mb-2">Login</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Masukkan NIM dan password Anda untuk masuk ke sistem.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-900 text-red-400 text-xs rounded-md leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password Anda"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white outline-none focus:border-slate-700 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:bg-blue-900 text-white text-xs font-bold rounded-md transition-colors shadow-md flex items-center justify-center"
          >
            {loading ? "Mencoba masuk..." : "Masuk ke Akun"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
          Belum punya akun?{" "}
          <Link href="/register" className="text-blue-400 hover:underline font-semibold">
            Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}

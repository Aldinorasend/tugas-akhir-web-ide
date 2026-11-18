"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Input password dengan toggle tampil/sembunyikan.
 * Gaya visual sama dengan input lain di halaman auth.
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white outline-none focus:border-slate-700 transition-colors"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 rounded"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

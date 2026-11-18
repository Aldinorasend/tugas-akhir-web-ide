"use client";

import { useState } from "react";
import { ChevronDown, ListChecks, ArrowRight } from "lucide-react";

/**
 * Strip hasil grader yang compact dan persistent di workspace.
 * Diagram: menampilkan skor + pesan/aturan dari checker tanpa modal.
 * Kode: menampilkan status tiap rule (✅/❌) dari hasil terakhir.
 */
export default function FeedbackStrip({
  hints,
  score,
  category,
  level,
  placeholder,
  onContinue,
}: {
  hints: string[];
  score?: number;
  category?: string;
  level?: number;
  placeholder?: string;
  onContinue?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasData = (hints && hints.length > 0) || score !== undefined;
  if (!hasData && !placeholder) return null;

  const passed = hints.filter((h) => h.startsWith("✅"));
  const failed = hints.filter((h) => !h.startsWith("✅"));
  const allPassed = !hasData || failed.length === 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-slate-800 bg-slate-950/80 text-[11px] leading-relaxed shrink-0"
    >
      <div className="flex items-center px-4 py-1.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={hasData ? expanded : undefined}
          disabled={!hasData}
          className={`flex flex-1 min-w-0 items-center gap-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 rounded ${
            hasData ? "hover:text-white" : "cursor-default"
          }`}
        >
          <ListChecks className={`w-3.5 h-3.5 shrink-0 ${!hasData ? "text-slate-600" : allPassed ? "text-green-500" : "text-orange-400"}`} />
          {!hasData ? (
            <span className="text-slate-500">{placeholder}</span>
          ) : (
            <>
              {score !== undefined && (
                <span className={`font-semibold tabular-nums ${score >= 100 ? "text-green-400" : "text-slate-200"}`}>
                  {Math.round(score)}%
                  <span className="text-slate-500 font-normal"> · hasil diagram</span>
                </span>
              )}
              {allPassed ? (
                <span className="text-green-400 font-medium">
                  Semua aturan terpenuhi{hints.length > 0 ? ` (${passed.length}/${hints.length})` : ""}
                </span>
              ) : (
                <span className="text-orange-300 font-medium">
                  {failed.length} aturan belum terpenuhi
                  {passed.length > 0 && <span className="text-slate-500 font-normal"> · {passed.length} sudah benar</span>}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 ml-auto shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>
        {onContinue && (
          <button
            onClick={onContinue}
            className="ml-3 shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Lanjut ke kode <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {hasData && expanded && (
        <div className="px-4 pb-2 pt-1">
          {hints.length > 0 && (
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {hints.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className={`shrink-0 ${h.startsWith("✅") ? "text-green-500" : "text-orange-400"}`}
                    aria-hidden="true"
                  >
                    {h.startsWith("✅") ? "✓" : "✗"}
                  </span>
                  <span className={h.startsWith("✅") ? "text-slate-500" : "text-slate-300"}>
                    {h.replace(/^[✅❌]\s*/, "")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(category || level) && (
            <p className="mt-1.5 text-[10px] text-slate-500 uppercase tracking-widest">
              {category && <>Kategori: {category}</>}
              {category && level ? " · " : ""}
              {level ? <>Bantuan: level {level}</> : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

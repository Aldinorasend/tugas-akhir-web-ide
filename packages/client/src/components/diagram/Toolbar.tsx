import { RelationType } from "@/app/types/uml";
import { Plus } from "lucide-react";

type ToolbarProps = {
  onAddClass: () => void;
  selectedRelation: RelationType;
  onRelationChange: (type: RelationType) => void;
  onSubmit?: () => void;
};

export default function Toolbar({
  onAddClass,
  selectedRelation,
  onRelationChange,
}: ToolbarProps) {
  const relations: { type: RelationType; color: string; label: string }[] = [
    { type: "association", color: "text-blue-500", label: "Association" },
    { type: "inheritance", color: "text-orange-500", label: "Inheritance" },
    { type: "interface", color: "text-violet-500", label: "Interface" },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/60 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-4">
      {/* Add Class Button */}
      <button
        onClick={onAddClass}
        className="flex w-32 items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-lg shadow-white/5 font-bold text-sm"
      >
        <Plus size={18} />
        Add Class
      </button>

      <div className="w-px h-8 bg-slate-700" />

      {/* Relation Type Selector */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/30">
        {relations.map(({ type, color, label }) => (
          <button
            key={type}
            onClick={() => onRelationChange(type)}
            title={label}
            className={`p-2.5 rounded-lg transition-all flex flex-col items-center justify-center ${selectedRelation === type
              ? "bg-slate-700 shadow-inner ring-1 ring-white/10 scale-105"
              : "hover:bg-slate-700/50 grayscale opacity-45 hover:opacity-100 hover:grayscale-0"
              }`}
          >
            <span className={`text-[10px] font-bold ${color}`} >{label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

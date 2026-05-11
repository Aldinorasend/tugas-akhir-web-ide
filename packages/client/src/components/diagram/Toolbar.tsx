import { RelationType } from "@/app/types/uml";
import { Plus, CheckCircle, Share2, GitMerge, Link as LinkIcon, Layers, Box } from "lucide-react";

type ToolbarProps = {
  onAddClass: () => void;
  selectedRelation: RelationType;
  onRelationChange: (type: RelationType) => void;
  onSubmit: () => void;
};

export default function Toolbar({
  onAddClass,
  selectedRelation,
  onRelationChange,
  onSubmit
}: ToolbarProps) {
  const relations: { type: RelationType; icon: any; color: string; label: string }[] = [
    { type: "association", icon: LinkIcon, color: "text-blue-500", label: "Association" },
    { type: "inheritance", icon: Share2, color: "text-orange-500", label: "Inheritance" },
    { type: "interface", icon: GitMerge, color: "text-violet-500", label: "Interface" },
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
        {relations.map(({ type, icon: Icon, color, label }) => (
          <button
            key={type}
            onClick={() => onRelationChange(type)}
            title={label}
            className={`p-2.5 rounded-lg transition-all flex flex-col items-center justify-center ${selectedRelation === type
              ? "bg-slate-700 shadow-inner ring-1 ring-white/10 scale-105"
              : "hover:bg-slate-700/50 grayscale opacity-40 hover:opacity-100 hover:grayscale-0"
              }`}
          >

            <Icon size={18} className={selectedRelation === type ? color : "text-slate-400"} />
            <span className={`text-[10px] font-bold ${color}`} >{label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-slate-700" />


    </div>
  );
}


"use client";

import React from "react";
import { 
  Files, 
  Search, 
  GitBranch, 
  PlayCircle, 
  Settings, 
  User,
  LayoutGrid
} from "lucide-react";

export default function Sidebar() {
  const activeIcon = "text-white";
  const inactiveIcon = "text-slate-500 hover:text-slate-300";

  return (
    <div className="w-16 h-full bg-[#1e1e1e] flex flex-col items-center py-4 border-r border-white/5 gap-6">
      <div className="p-2 rounded-xl bg-orange-600/10 mb-4">
        <LayoutGrid size={24} className="text-orange-600" />
      </div>

      <nav className="flex flex-col gap-8 flex-1">
        <Files size={24} className={activeIcon} />
        <Search size={24} className={inactiveIcon} />
        <GitBranch size={24} className={inactiveIcon} />
        <PlayCircle size={24} className={inactiveIcon} />
      </nav>

      <div className="flex flex-col gap-6 mb-2">
        <Settings size={24} className={inactiveIcon} />
        <User size={24} className={inactiveIcon} />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PlusCircle, LogOut, Settings, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
          <button className="p-3 text-slate-500 hover:text-slate-300 transition-colors">
            <Settings className="w-6 h-6" />
          </button>
          <button className="p-3 text-slate-500 hover:text-red-400 transition-colors">
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

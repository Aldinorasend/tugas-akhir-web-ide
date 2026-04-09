import JavaEditor from "@/components/JavaEditor";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";

export default function Home() {
  return (
    <main className="flex h-screen w-full bg-slate-950 overflow-hidden">
      <JavaEditor />
      <ScaffoldingPanel />
    </main>
  );
}

import JavaEditor from "@/components/JavaEditor";
import ScaffoldingPanel from "@/components/ScaffoldingPanel";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <main className="flex h-screen w-full bg-[#181818] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        <JavaEditor />
        <ScaffoldingPanel />
      </div>
    </main>
  );
}

"use client";

type Props = {
  output: string;
};

export default function OutputPanel({ output }: Props) {
  return (
    <div
    className="bg-[#1e1e1e] text-orange-500 p-4 h-40 w-full overflow-auto mt-1   ">  
      <pre>{output}</pre>
    </div>
  );
}
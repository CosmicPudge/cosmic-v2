"use client";

export default function CloudLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      <div className="absolute left-[8%] top-[12%] h-64 w-64 rounded-full bg-white/10 blur-3xl animate-[float_40s_linear_infinite]" />

      <div className="absolute right-[10%] top-[28%] h-80 w-80 rounded-full bg-white/5 blur-3xl animate-[float_55s_linear_infinite_reverse]" />

      <div className="absolute left-[30%] bottom-[10%] h-72 w-72 rounded-full bg-white/5 blur-3xl animate-[float_50s_linear_infinite]" />

    </div>
  );
}
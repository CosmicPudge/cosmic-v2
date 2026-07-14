"use client";

export default function AmbientHeader() {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-6">
      <h1 className="text-2xl font-light tracking-[0.4em] text-white">
        COSMIC
      </h1>

      <p className="text-sm uppercase tracking-[0.25em] text-white/50">
        Ambient Mode
      </p>
    </div>
  );
}
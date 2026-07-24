"use client";

import UniverseBackground from "@/components/os/background/UniverseBackground";

export default function BackgroundPreviewPage() {
  return (
    <main className="relative h-screen overflow-hidden bg-black">
      <UniverseBackground progress={1} />

      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur-xl">
          <h1 className="text-5xl font-bold text-white">
            Cosmic Background
          </h1>

          <p className="mt-4 text-white/70">
            Phase 2 Preview
          </p>
        </div>
      </div>
    </main>
  );
}
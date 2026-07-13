"use client";

import CosmicIcon from "@/components/icons/cosmic/CosmicIcon";

export default function GlyphPage() {
  return (
    <main className="min-h-screen bg-black p-12 text-white">
      <h1 className="mb-10 text-5xl font-bold">
        Cosmic Glyph Lab
      </h1>

      <div className="flex items-center gap-10 rounded-3xl border border-white/10 bg-white/5 p-10">

        <CosmicIcon
          glyph="home"
          size={24}
        />

        <CosmicIcon
          glyph="home"
          size={36}
        />

        <CosmicIcon
          glyph="home"
          size={48}
        />

        <CosmicIcon
          glyph="home"
          size={64}
        />

      </div>
    </main>
  );
}
"use client";

import SearchSurface from "@/components/apps/search/SearchSurface";

/** Legacy launcher entry point, now backed by the canonical Search surface. */
export default function CosmicLauncher({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[180] flex items-start justify-center px-3 pt-[10svh]" role="dialog" aria-modal="true" aria-label="Cosmic launcher">
      <button type="button" className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-md" onClick={onClose} aria-label="Close launcher" />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/12 bg-[#080d1b]/94 shadow-2xl backdrop-blur-3xl">
        <SearchSurface mode="overlay" autoFocus onClose={onClose} />
      </div>
    </div>
  );
}

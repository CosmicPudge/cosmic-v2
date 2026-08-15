"use client";

import { motion } from "framer-motion";

import SearchSurface from "@/components/apps/search/SearchSurface";
import { useSearchRuntime } from "@/components/apps/search/SearchProvider";

export default function SearchOverlay() {
  const { overlayOpen, overlayQuery, closeSearch } = useSearchRuntime();
  if (!overlayOpen) return null;

  return (
    <div className="fixed inset-0 z-[190] flex items-start justify-center px-3 pb-3 pt-[max(3.5rem,8svh)] sm:px-6 sm:pt-[11svh]" role="dialog" aria-modal="true" aria-label="Global Cosmic Search">
      <motion.button
        type="button"
        aria-label="Close Search"
        className="absolute inset-0 cursor-default bg-[#02040c]/64 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={closeSearch}
      />
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/14 bg-[#080d1b]/92 shadow-[0_36px_130px_rgba(0,0,0,.58),inset_0_1px_0_rgba(255,255,255,.09)] backdrop-blur-3xl sm:rounded-[2rem]"
      >
        <SearchSurface mode="overlay" initialQuery={overlayQuery} autoFocus onClose={closeSearch} />
      </motion.div>
    </div>
  );
}

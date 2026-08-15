"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import SearchSurface from "./SearchSurface";

export default function SearchPageView() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black/10 px-3 py-4 text-white sm:px-7 sm:py-8 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-cyan-300/[0.055] blur-[130px]" />
      <div className="relative mx-auto max-w-5xl">
        <header className="mb-5 flex items-end justify-between gap-4 px-1 sm:mb-8">
          <div>
            <button type="button" onClick={() => router.push("/os")} className="mb-5 inline-flex items-center gap-2 text-sm text-white/48 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-100/40"><Sparkles className="h-3.5 w-3.5" /> Cosmic discovery</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Search</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42 sm:text-base">Apps and current Cosmic data, ranked locally with deterministic matching.</p>
          </div>
        </header>
        <div className="overflow-hidden rounded-[1.8rem] border border-white/11 bg-[#070c18]/58 p-3 shadow-[0_30px_100px_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.07)] backdrop-blur-2xl sm:rounded-[2.25rem] sm:p-6">
          <SearchSurface mode="page" autoFocus />
        </div>
      </div>
    </main>
  );
}

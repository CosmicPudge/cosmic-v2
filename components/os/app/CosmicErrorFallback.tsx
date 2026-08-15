"use client";

interface CosmicErrorFallbackProps {
  onRetry: () => void;
}

export default function CosmicErrorFallback({
  onRetry,
}: CosmicErrorFallbackProps) {
  return (
    <main className="relative grid min-h-[100svh] place-items-center px-6 py-16 text-white">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-black/40 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-12">
        <p className="text-xs uppercase tracking-[0.35em] text-rose-100/45">
          Cosmic recovery
        </p>
        <h1 className="mt-6 text-3xl font-light tracking-tight sm:text-4xl">
          Something went wrong.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/48">
          Cosmic encountered an unexpected interruption. Your local data has not been changed.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-7 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Try again
        </button>
      </section>
    </main>
  );
}

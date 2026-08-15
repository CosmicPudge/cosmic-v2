import Link from "next/link";

export default function CosmicNotFound() {
  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden px-6 py-16 text-white">
      <section className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-black/30 px-7 py-10 text-center shadow-2xl shadow-black/30 backdrop-blur-2xl sm:px-12 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-[0.42em] text-cyan-100/45">
          Cosmic navigation
        </p>
        <p className="mt-7 text-[clamp(5rem,18vw,10rem)] font-extralight leading-none tracking-[-0.08em] text-white/95">
          404
        </p>
        <h1 className="mt-4 text-3xl font-light tracking-tight sm:text-5xl">
          Lost in space.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/48 sm:text-base">
          This page drifted outside the Cosmic map.
        </p>
        <Link
          href="/os"
          className="mt-8 inline-flex rounded-full border border-cyan-100/20 bg-cyan-100/10 px-5 py-2.5 text-sm text-cyan-50 transition hover:border-cyan-100/35 hover:bg-cyan-100/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/70"
        >
          Return to Dashboard
        </Link>
      </section>
    </main>
  );
}

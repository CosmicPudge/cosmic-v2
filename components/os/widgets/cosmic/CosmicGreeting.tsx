export default function CosmicGreeting() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">
        GOOD AFTERNOON
      </p>

      <h2 className="mt-2 text-2xl font-semibold text-white">
        Welcome back.
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-white/60">
        Everything is running smoothly. Here's your day at a glance.
      </p>
    </div>
  );
}
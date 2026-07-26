export default function ClockCurrent() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">
        LOCAL TIME
      </p>

      <h1 className="mt-3 text-5xl font-light text-white">
        12:00
      </h1>

      <p className="mt-2 text-sm text-white/60">
        PM
      </p>
    </div>
  );
}
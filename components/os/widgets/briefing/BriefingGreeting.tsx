export default function BriefingGreeting() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">
        GOOD MORNING
      </p>

      <h2 className="mt-2 text-2xl font-semibold text-white">
        Ready for today?
      </h2>

      <p className="mt-2 text-sm text-white/60">
        Here's a quick overview before you get started.
      </p>
    </div>
  );
}
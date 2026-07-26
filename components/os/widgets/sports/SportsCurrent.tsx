export default function SportsCurrent() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">
        Current
      </p>

      <h3 className="mt-2 text-lg font-semibold text-white">
        No Live Games
      </h3>

      <p className="mt-1 text-sm text-white/60">
        Your favorite teams aren't playing right now.
      </p>
    </div>
  );
}
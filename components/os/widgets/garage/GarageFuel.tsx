export default function GarageFuel() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">
        Fuel
      </p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-white/60">
          Tank Level
        </span>

        <span className="font-semibold text-white">
          --
        </span>
      </div>
    </div>
  );
}
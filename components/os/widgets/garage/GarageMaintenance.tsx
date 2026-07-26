export default function GarageStatus() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">
        Vehicle
      </p>

      <h3 className="mt-2 text-xl font-semibold text-white">
        No Vehicle Connected
      </h3>

      <p className="mt-1 text-sm text-white/60">
        Connect a vehicle to begin tracking.
      </p>
    </div>
  );
}
export default function SystemStorage() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <span className="text-white/60">
          Storage
        </span>

        <span className="text-white">
          512 GB
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-white/70" />
      </div>
    </div>
  );
}
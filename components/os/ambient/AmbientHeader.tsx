export default function AmbientHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="text-lg font-light tracking-[0.38em] text-white">
          COSMIC
        </p>
        <p className="mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-white/35">
          Ambient mode
        </p>
      </div>

      <p className="text-right text-[0.65rem] uppercase tracking-[0.2em] text-white/28">
        Press anywhere to return
      </p>
    </header>
  );
}

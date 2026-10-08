export default function CosmosKioskLoadingScreen({ label = "Starting your display" }: { label?: string }) {
  return (
    <main
      className="fixed inset-0 z-[9999] grid min-h-[100dvh] min-w-[100dvw] place-items-center overflow-hidden bg-black text-white"
      aria-busy="true"
      aria-label="Cosmos is loading"
    >
      <div className="relative flex flex-col items-center text-center">
        <div className="relative mb-8 h-24 w-24 sm:h-28 sm:w-28">
          <div className="absolute inset-0 rounded-full border border-violet-300/15" />
          <div className="absolute inset-[10%] animate-[spin_8s_linear_infinite] rounded-full border border-transparent border-t-violet-300/80 border-r-cyan-200/45" />
          <div className="absolute inset-[28%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,.95),rgba(167,139,250,.82)_18%,rgba(99,102,241,.45)_48%,rgba(0,0,0,0)_72%)] shadow-[0_0_48px_rgba(139,92,246,.38)]" />
          <div className="absolute inset-[43%] animate-pulse rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,.8)]" />
        </div>

        <p className="text-[clamp(1.15rem,2.6vw,1.85rem)] font-semibold tracking-[0.34em] text-white/95">
          COSMOS
        </p>
        <p className="mt-3 text-[clamp(.68rem,1.2vw,.9rem)] font-medium uppercase tracking-[0.2em] text-white/38">
          {label}
        </p>
      </div>
    </main>
  );
}

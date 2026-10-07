import { cosmosMilestones, homeChecks, getHomeProgress } from "@/config/cosmosMilestones";

export default function CosmosProgressPage() {
  const { completed, total, percent } = getHomeProgress();

  return (
    <main className="min-h-screen bg-[#030511] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300/70">Cosmos Build Tracker</p>
        <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Milestone 1</h1>
            <p className="mt-2 text-white/55">Home</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-5xl font-semibold tabular-nums">{percent}%</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">{completed} of {total} checks complete</p>
          </div>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400" style={{ width: `${percent}%` }} />
        </div>

        <section className="mt-8 grid gap-3 md:grid-cols-2">
          {homeChecks.map(([label, done]) => (
            <div key={label} className={`rounded-2xl border p-4 ${done ? "border-emerald-300/20 bg-emerald-400/[0.06]" : "border-white/10 bg-white/[0.035]"}`}>
              <div className="flex items-center gap-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-emerald-400/15 text-emerald-200" : "bg-white/8 text-white/35"}`}>
                  {done ? "✓" : "○"}
                </span>
                <span className={done ? "text-white/80" : "text-white/55"}>{label}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">All milestones</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {cosmosMilestones.map((name, index) => (
              <div key={name} className={`rounded-xl border px-3 py-3 text-sm ${index === 1 ? "border-violet-300/30 bg-violet-400/10 text-white" : index < 1 ? "border-emerald-300/20 bg-emerald-400/[0.05] text-emerald-100/75" : "border-white/8 bg-white/[0.02] text-white/35"}`}>
                <span className="mr-2 text-xs tabular-nums text-white/30">{index}</span>
                {name}
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-sm text-white/35">Rule: the next milestone does not begin until the current milestone is 100% complete. Milestone 1 cannot close unless both /cosmos-progress and /cosmos-home are live, working, and showing 100%.</p>
      </div>
    </main>
  );
}

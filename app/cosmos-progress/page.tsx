import Link from "next/link";

import {
  cosmosMilestones,
  foundationChecks,
  getFoundationProgress,
  getHomeProgress,
  homeChecks,
} from "@/config/cosmosMilestones";

type ProgressPageProps = {
  searchParams?: Promise<{ milestone?: string }>;
};

export default async function CosmosProgressPage({ searchParams }: ProgressPageProps) {
  const params = await searchParams;
  const requested = Number(params?.milestone ?? 1);
  const milestoneIndex = Number.isInteger(requested) && requested >= 0 && requested < cosmosMilestones.length ? requested : 1;

  const milestoneName = cosmosMilestones[milestoneIndex];
  const isFoundation = milestoneIndex === 0;
  const isHome = milestoneIndex === 1;
  const checks = isFoundation ? foundationChecks : isHome ? homeChecks : [];
  const progress = isFoundation ? getFoundationProgress() : isHome ? getHomeProgress() : { completed: 0, total: 0, percent: 0 };
  const status = progress.percent === 100 ? "Complete" : milestoneIndex === 1 ? "In progress" : milestoneIndex === 0 ? "Complete" : "Not started";

  return (
    <main className="min-h-screen bg-[#030511] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300/70">Cosmos Build Tracker</p>
            <div className="mt-3">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Milestone {milestoneIndex}</h1>
              <p className="mt-2 text-white/55">{milestoneName}</p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-white/55">
            {status}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <p className="max-w-xl text-sm leading-6 text-white/38">
            {milestoneIndex === 0
              ? "The shared Cosmos foundation is complete."
              : milestoneIndex === 1
                ? progress.percent === 100 ? "Home is complete. Milestone 2 can begin after the dev merge is verified." : "Home is being built now. Every check below must be complete before Milestone 2 begins."
                : "This milestone has not started yet. Cosmos moves forward one milestone at a time."}
          </p>
          <div className="text-left md:text-right">
            <p className="text-5xl font-semibold tabular-nums">{progress.percent}%</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">
              {progress.total ? `${progress.completed} of ${progress.total} checks complete` : "Waiting to begin"}
            </p>
          </div>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-[width] duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {checks.length ? (
          <section className="mt-8 grid gap-3 md:grid-cols-2">
            {checks.map(([label, done]) => (
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
        ) : (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center">
            <p className="text-sm font-semibold text-white/70">Milestone {milestoneIndex} has not started yet.</p>
            <p className="mt-2 text-sm text-white/38">Its checklist will appear here when the previous milestone reaches 100%.</p>
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Jump to milestone</p>
              <h2 className="mt-1 text-lg font-semibold">All milestones</h2>
            </div>
            <p className="hidden text-xs text-white/30 sm:block">Click any milestone to view its progress.</p>
          </div>

          <nav className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Cosmos milestones">
            {cosmosMilestones.map((name, index) => {
              const selected = index === milestoneIndex;
              const complete = index === 0;
              const current = index === 1;
              return (
                <Link
                  key={name}
                  href={`/cosmos-progress?milestone=${index}`}
                  aria-current={selected ? "page" : undefined}
                  className={`group rounded-xl border px-3 py-3 text-sm transition hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-violet-400/[0.07] focus-visible:outline-2 focus-visible:outline-cyan-200 ${selected ? "border-violet-300/35 bg-violet-400/12 text-white shadow-[0_0_30px_rgba(139,92,246,.08)]" : complete ? "border-emerald-300/20 bg-emerald-400/[0.05] text-emerald-100/75" : current ? "border-cyan-300/18 bg-cyan-400/[0.04] text-cyan-50/70" : "border-white/8 bg-white/[0.02] text-white/35"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs tabular-nums text-white/30">{index}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${complete ? "bg-emerald-300" : current ? "bg-cyan-300" : "bg-white/15"}`} />
                  </div>
                  <span className="mt-1 block font-medium">{name}</span>
                </Link>
              );
            })}
          </nav>
        </section>

        <p className="mt-10 text-sm text-white/35">
          Rule: the next milestone does not begin until the current milestone is 100% complete.
          {milestoneIndex === 1 ? " Milestone 1 cannot close unless both /cosmos-progress and /cosmos-home are live, working, and showing 100%." : ""}
        </p>
      </div>
    </main>
  );
}

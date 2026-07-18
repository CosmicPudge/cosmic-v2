import { SchoolCard } from "@/components/school/SchoolCard";
import type { SchoolOverviewData } from "@/lib/school/types";

export function GPAAndCreditsCard({ academics }: { academics: SchoolOverviewData["academics"] }) {
  return (
    <SchoolCard title="Academic standing" eyebrow="At a glance" actionHref="/school/grades">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-2xl bg-gradient-to-br from-sky-100/15 to-indigo-200/10 p-4">
          <p className="text-xs font-medium text-white/50">Current GPA</p>
          <p className="mt-1 text-4xl font-semibold tracking-[-0.045em] tabular-nums text-white">{academics.currentGpa}</p>
          <p className="mt-2 text-xs text-emerald-100/75">Term GPA {academics.termGpa}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <p className="text-2xl font-semibold tabular-nums text-white">{academics.creditsEarned}</p>
          <p className="mt-1 text-xs text-white/45">Credits earned</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <p className="text-2xl font-semibold tabular-nums text-white">{academics.creditsRemaining}</p>
          <p className="mt-1 text-xs text-white/45">Credits remaining</p>
        </div>
      </div>
    </SchoolCard>
  );
}

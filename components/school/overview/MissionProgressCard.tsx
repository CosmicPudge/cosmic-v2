import Link from "next/link";
import { ArrowRight, Flag } from "lucide-react";
import { ProgressBar, SchoolCard } from "@/components/school/SchoolCard";
import type { SchoolOverviewData } from "@/lib/school/types";

export function MissionProgressCard({ mission }: { mission: SchoolOverviewData["mission"] }) {
  return (
    <SchoolCard title="Mission progress" eyebrow="AFROTC" actionHref="/school/afrotc" tone="mission">
      <div className="rounded-2xl border border-amber-100/10 bg-gradient-to-br from-amber-100/[0.11] to-transparent p-4">
        <div className="flex items-start justify-between gap-3"><div><Flag className="mb-3 size-4 text-amber-100/80" aria-hidden="true" /><p className="text-sm font-medium text-white">{mission.title}</p></div><p className="school-number-enter text-3xl font-semibold tracking-tight tabular-nums text-amber-50 motion-reduce:animate-none">{mission.progressPercent}%</p></div>
        <div className="mt-4"><ProgressBar value={mission.progressPercent} label="Overall readiness" /></div>
      </div>
      <div className="mt-4 rounded-2xl bg-black/10 p-3.5"><p className="text-xs font-medium text-white/45">Next milestone</p><p className="mt-1 text-sm text-white">{mission.nextMilestone}</p><p className="mt-1 text-xs text-emerald-100/75">{mission.impactLabel}</p><Link href="/school/afrotc" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-100 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">Open mission <ArrowRight className="size-3.5" aria-hidden="true" /></Link></div>
    </SchoolCard>
  );
}

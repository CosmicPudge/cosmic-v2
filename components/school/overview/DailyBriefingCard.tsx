import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SchoolCard } from "@/components/school/SchoolCard";
import type { SchoolOverviewData } from "@/lib/school/types";

interface DailyBriefingCardProps {
  studentName: SchoolOverviewData["studentName"];
  dateLabel: SchoolOverviewData["dateLabel"];
  briefing: SchoolOverviewData["briefing"];
}

export function DailyBriefingCard({ studentName, dateLabel, briefing }: DailyBriefingCardProps) {
  return (
    <SchoolCard tone="focus" className="relative overflow-hidden bg-[linear-gradient(120deg,rgba(52,91,157,0.34),rgba(255,255,255,0.07)_55%,rgba(123,111,196,0.22))] p-0">
      <div className="school-hero-light absolute -right-24 -top-28 size-80 rounded-full bg-sky-200/15 blur-3xl motion-reduce:animate-none" aria-hidden="true" />
      <div className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-end">
        <div>
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Daily briefing
          </div>
          <p className="text-sm text-white/50">{dateLabel}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">{studentName ? `Good morning, ${studentName}.` : "Your academic overview."}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">{briefing.summary}</p>
          <Link href={briefing.actionHref} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
            {briefing.actionLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="space-y-3" aria-label="Today's priority facts">
          {briefing.facts.map((fact) => (
            <li key={fact} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm leading-5 text-white/75 backdrop-blur-sm">
              {fact}
            </li>
          ))}
          {briefing.facts.length === 0 && <li className="rounded-2xl border border-dashed border-white/15 bg-black/10 px-4 py-5 text-sm leading-6 text-white/55">Your priority facts will appear after an academic provider connects.</li>}
        </ul>
      </div>
    </SchoolCard>
  );
}

import { CalendarRange, GraduationCap } from "lucide-react";
import { ProgressBar, SchoolCard } from "@/components/school/SchoolCard";
import type { SchoolOverviewData } from "@/lib/school/types";

export function SemesterProgressCard({ semester }: { semester: SchoolOverviewData["semester"] }) {
  const creditPercent = Math.round((semester.completedCredits / semester.totalCredits) * 100);

  return (
    <SchoolCard title="Semester progress" eyebrow={semester.name}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <CalendarRange className="mb-4 size-4 text-sky-100/70" aria-hidden="true" />
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-white">{semester.elapsedPercent}%</p>
          <p className="mt-1 text-xs text-white/45">Time elapsed</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <GraduationCap className="mb-4 size-4 text-violet-100/70" aria-hidden="true" />
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-white">{semester.completedCredits}<span className="text-base text-white/40">/{semester.totalCredits}</span></p>
          <p className="mt-1 text-xs text-white/45">Credits complete</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <ProgressBar value={semester.elapsedPercent} label={semester.elapsedLabel} />
        <ProgressBar value={creditPercent} label="Course credit completion" />
      </div>
    </SchoolCard>
  );
}

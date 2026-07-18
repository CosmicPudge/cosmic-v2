import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SchoolCard, SchoolEmptyState } from "@/components/school/SchoolCard";
import type { SchoolGrade } from "@/lib/school/types";

export function RecentGradesCard({ grades }: { grades: SchoolGrade[] }) {
  return (
    <SchoolCard title="Recent grades" eyebrow="New feedback" actionHref="/school/grades">
      <ul className="divide-y divide-white/10">
        {grades.map((grade) => (
          <li key={grade.id}>
            <Link href="/school/grades" className="group grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
              <span className="min-w-0"><span className="block truncate text-sm font-medium text-white">{grade.assessment}</span><span className="mt-1 block text-xs text-white/45">{grade.courseCode} · {grade.receivedLabel}</span></span>
              <span className="font-mono text-xs tabular-nums text-white/60">{grade.score}</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-sky-100">{grade.letterGrade}<ChevronRight className="size-3.5 text-white/25 transition group-hover:text-white/75" aria-hidden="true" /></span>
            </Link>
          </li>
        ))}
        {grades.length === 0 && <li><SchoolEmptyState>Grades will appear after your first graded assessment.</SchoolEmptyState></li>}
      </ul>
    </SchoolCard>
  );
}

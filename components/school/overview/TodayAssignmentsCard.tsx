import Link from "next/link";
import { CheckCircle2, Circle, Clock3, TriangleAlert } from "lucide-react";
import { SchoolCard, SchoolEmptyState } from "@/components/school/SchoolCard";
import type { SchoolAssignment } from "@/lib/school/types";

const statusLabel = {
  overdue: "Overdue",
  dueToday: "Due today",
  submitted: "Submitted",
  upcoming: "Upcoming",
} as const;

export function TodayAssignmentsCard({ assignments }: { assignments: SchoolAssignment[] }) {
  return (
    <SchoolCard title="Today’s work" eyebrow="Priority queue" actionHref="/school/assignments">
      <ul className="space-y-2">
        {assignments.map((assignment) => {
          const submitted = assignment.status === "submitted";

          return (
            <li key={assignment.id}>
              <Link href="/school/assignments" className="group flex gap-3 rounded-2xl px-2 py-3 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
                {submitted ? <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-200/75" aria-hidden="true" /> : assignment.priority === "high" ? <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-amber-100/80" aria-hidden="true" /> : <Circle className="mt-0.5 size-4.5 shrink-0 text-white/35" aria-hidden="true" />}
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium ${submitted ? "text-white/50 line-through" : "text-white"}`}>{assignment.title}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
                    <span>{assignment.courseCode}</span><span aria-hidden="true">·</span><span>{assignment.dueLabel}</span>
                  </span>
                </span>
                <span className="mt-0.5 flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums text-white/40"><Clock3 className="size-3" aria-hidden="true" />{assignment.estimatedMinutes}m</span>
              </Link>
            </li>
          );
        })}
        {assignments.length === 0 && <li><SchoolEmptyState>No assignments need attention today.</SchoolEmptyState></li>}
      </ul>
      {assignments.length > 0 && <p className="mt-4 border-t border-white/10 pt-4 text-xs text-white/35">Status labels: {Object.values(statusLabel).join(" · ")}</p>}
    </SchoolCard>
  );
}

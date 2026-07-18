import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SchoolCard, SchoolEmptyState } from "@/components/school/SchoolCard";
import type { SchoolDeadline } from "@/lib/school/types";

export function UpcomingDeadlinesCard({ deadlines }: { deadlines: SchoolDeadline[] }) {
  return (
    <SchoolCard title="Upcoming deadlines" eyebrow="Looking ahead" actionHref="/school/assignments">
      <ul className="divide-y divide-white/10">
        {deadlines.map((deadline) => (
          <li key={deadline.id}>
            <Link href="/school/assignments" className="group flex items-center gap-4 py-3 first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
              <span className={`grid size-10 shrink-0 place-items-center rounded-2xl border text-xs font-semibold tabular-nums ${deadline.priority === "high" ? "border-amber-100/15 bg-amber-100/10 text-amber-100" : "border-white/10 bg-white/[0.05] text-white/65"}`}>{deadline.countdown}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{deadline.title}</span>
                <span className="mt-1 block truncate text-xs text-white/45">{deadline.courseCode} · {deadline.dueLabel}</span>
              </span>
              <ArrowUpRight className="size-4 text-white/25 transition group-hover:text-white/70" aria-hidden="true" />
            </Link>
          </li>
        ))}
        {deadlines.length === 0 && <li><SchoolEmptyState>No upcoming deadlines are available.</SchoolEmptyState></li>}
      </ul>
    </SchoolCard>
  );
}

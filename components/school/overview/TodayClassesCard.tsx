import Link from "next/link";
import { Check, ChevronRight, MapPin } from "lucide-react";
import { SchoolCard, SchoolEmptyState } from "@/components/school/SchoolCard";
import type { SchoolClass } from "@/lib/school/types";

export function TodayClassesCard({ classes }: { classes: SchoolClass[] }) {
  const upcoming = classes.filter((schoolClass) => schoolClass.status === "upcoming");
  const completed = classes.filter((schoolClass) => schoolClass.status === "completed");

  return (
    <SchoolCard title="Today’s classes" eyebrow="Your day" actionHref="/school/schedule">
      <div className="space-y-1">
        {upcoming.map((schoolClass, index) => (
          <Link key={schoolClass.id} href="/school/schedule" className={`group flex gap-3 rounded-2xl px-2 py-3 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 ${index === 0 ? "bg-white/[0.055]" : ""}`}>
            <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${schoolClass.accent}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-white">{schoolClass.courseName}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-white/50">{schoolClass.startsAt}</span>
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs text-white/45"><MapPin className="size-3" aria-hidden="true" />{schoolClass.location} · {schoolClass.endsAt}</span>
              <span className="mt-1.5 block text-[0.68rem] font-semibold tracking-[0.15em] text-white/35">{schoolClass.courseCode}</span>
            </span>
            <ChevronRight className="mt-2 size-4 shrink-0 text-white/25 transition group-hover:text-white/70" aria-hidden="true" />
          </Link>
        ))}
        {upcoming.length === 0 && completed.length === 0 && <SchoolEmptyState>No class sessions are available today. Connect your calendar or course schedule to see them here.</SchoolEmptyState>}
      </div>
      {completed.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs font-medium text-white/35">Earlier today</p>
          {completed.map((schoolClass) => (
            <div key={schoolClass.id} className="flex items-center gap-2 px-2 py-1.5 text-sm text-white/45">
              <Check className="size-3.5 text-emerald-200/70" aria-hidden="true" />
              <span className="flex-1">{schoolClass.courseName}</span>
              <span className="font-mono text-xs">{schoolClass.startsAt}</span>
            </div>
          ))}
        </div>
      )}
    </SchoolCard>
  );
}

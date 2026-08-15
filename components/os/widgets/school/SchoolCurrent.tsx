import type { SchoolClass } from "@/components/school/data/types";
import type { SchoolAssignment } from "@/components/school/data/types";

export default function SchoolCurrent({
  term,
  nextClass,
  isCurrentClass = false,
  urgentAssignment,
}: {
  term: string;
  nextClass?: SchoolClass;
  isCurrentClass?: boolean;
  urgentAssignment?: SchoolAssignment;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">
        {nextClass ? (isCurrentClass ? "Now" : "Next Class") : urgentAssignment ? "Urgent Assignment" : "Semester"}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-white">
        {nextClass?.name ?? urgentAssignment?.title ?? term}
      </h3>
      <p className="mt-1 text-sm text-white/60">
        {nextClass
          ? `${nextClass.start.toLocaleDateString("en-US", { weekday: "short" })} · ${nextClass.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}${nextClass.location ? ` · ${nextClass.location}` : ""}`
          : urgentAssignment
          ? urgentAssignment.due.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
          : "No upcoming class is scheduled."}
      </p>
    </div>
  );
}

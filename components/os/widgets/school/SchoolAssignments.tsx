import type { SchoolAssignment } from "@/components/school/data/types";
import { WidgetEmpty } from "@/components/os/ui/widget";

export default function SchoolAssignments({ assignments }: { assignments: SchoolAssignment[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">Assignments</p>
      {assignments.length === 0 ? <WidgetEmpty compact title="No assignments due." description="" /> : <div className="mt-2 space-y-1.5">{assignments.slice(0, 2).map((assignment) => <div key={assignment.id} className="flex min-w-0 items-center justify-between gap-2 text-sm"><span className="truncate text-white/75">{assignment.title}</span><span className="shrink-0 text-xs text-white/40">{assignment.due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>)}</div>}
    </div>
  );
}

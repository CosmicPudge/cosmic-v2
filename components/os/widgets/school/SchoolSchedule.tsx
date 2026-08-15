import type { SchoolClass } from "@/components/school/data/types";
import { WidgetEmpty } from "@/components/os/ui/widget";

export default function SchoolSchedule({ classes }: { classes: SchoolClass[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">Upcoming Classes</p>
      {classes.length === 0 ? <WidgetEmpty compact title="No classes scheduled." description="" /> : <div className="mt-2 space-y-1.5">{classes.slice(0, 3).map((schoolClass) => <div key={schoolClass.id} className="flex min-w-0 items-center justify-between gap-2 text-sm"><span className="truncate text-white/75">{schoolClass.name}</span><span className="shrink-0 text-xs text-white/40">{schoolClass.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span></div>)}</div>}
    </div>
  );
}

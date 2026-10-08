"use client";

import Link from "next/link";
import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { useSchoolData } from "@/components/school/hooks/useSchoolData";
import { useProjects } from "@/hooks/os/useProjects";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";

export default function TasksWidget() {
  const { presentation } = useWidgetContext();
  const school = useSchoolData({ enabled: presentation !== "kiosk" });
  const projects = useProjects();
  const schoolTasks = school.data?.assignments.filter((item) => !item.completed) ?? [];
  const projectTasks = projects.data.tasks.filter((item) => !item.completed);
  const combined = [
    ...schoolTasks.map((item) => ({ title: item.title, due: item.due, priority: item.priority ?? "normal" })),
    ...projectTasks.map((item) => ({ title: item.title, due: item.dueDate ? new Date(`${item.dueDate}T12:00:00`) : undefined, priority: item.priority ?? "normal" })),
  ].sort((a, b) => (a.due?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.due?.getTime() ?? Number.MAX_SAFE_INTEGER));
  const high = combined.filter((item) => item.priority === "high").length;
  const next = combined[0];

  if (presentation === "kiosk") {
    return <KioskSceneFrame scene="tasks" eyebrow="COSMOS • TASKS" title={next?.title ?? "All clear."} subtitle={combined.length ? `${combined.length} open · ${high} high priority` : "No open school or project tasks"}><div className="kiosk-native-scene-details">{next?.due ? <span>Next due · {next.due.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span> : null}</div></KioskSceneFrame>;
  }

  return <Widget accent="cosmic"><WidgetHeader title="Tasks" subtitle="School + projects" /><WidgetBody>{combined.length ? <div className="space-y-2">{combined.slice(0, 4).map((item, index) => <div key={`${item.title}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><p className="text-sm text-white/80">{item.title}</p>{item.due ? <p className="mt-1 text-xs text-white/40">{item.due.toLocaleDateString()}</p> : null}</div>)}</div> : <p className="text-sm text-white/45">No open tasks.</p>}</WidgetBody><WidgetFooter><Link href="/tasks" className="text-xs text-cyan-100">Open Tasks</Link></WidgetFooter></Widget>;
}

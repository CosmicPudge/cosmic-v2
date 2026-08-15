"use client";

import Link from "next/link";
import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty, WidgetLoading } from "@/components/os/ui/widget";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { reminderStatus, useGarage } from "@/hooks/os/useGarage";

export default function GarageWidget() {
  const { size } = useWidgetContext();
  const { loading, selectedVehicle, summary } = useGarage();
  const maintenance = summary?.maintenance.filter((item) => ["overdue", "dueSoon"].includes(summary.statusById.get(item.id) ?? "")) ?? [];
  const criticalIssue = summary?.issues.find((item) => item.status !== "resolved" && ["critical", "high"].includes(item.severity));
  const reminder = selectedVehicle ? summary?.reminders.find((item) => reminderStatus(item, selectedVehicle.currentMileage) === "overdue" || reminderStatus(item, selectedVehicle.currentMileage) === "dueSoon") : undefined;
  const priority = criticalIssue ? `${criticalIssue.severity} issue: ${criticalIssue.title}` : maintenance[0] ? `${summary?.statusById.get(maintenance[0].id)}: ${maintenance[0].name}` : reminder ? `Reminder: ${reminder.title}` : undefined;
  return <Widget accent="garage"><WidgetHeader title="Garage" subtitle={selectedVehicle ? selectedVehicle.status : "Vehicle dashboard"}/><WidgetBody scrollable={size === "large"}>{loading ? <WidgetLoading label="Loading garage" compact/> : !selectedVehicle ? <WidgetEmpty title="No vehicles yet" description="Add a vehicle in Garage to begin tracking." compact/> : <div className="space-y-3"><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="font-medium">{selectedVehicle.nickname}</p><p className="text-sm text-white/55">{selectedVehicle.currentMileage.toLocaleString()} mi · {selectedVehicle.status}</p></div>{priority && <div className="rounded-xl border border-amber-200/25 bg-amber-200/10 p-3"><p className="text-xs uppercase tracking-wide text-amber-100/70">Needs attention</p><p className="mt-1 text-sm">{priority}</p></div>}{size !== "small" && <div className="space-y-1 text-sm text-white/70"><p>{maintenance.length} maintenance item(s) due soon or overdue</p><p>{summary?.issues.filter((item) => item.status !== "resolved").length ?? 0} open issue(s)</p></div>}{size === "large" && <div className="space-y-2 border-t border-white/10 pt-2 text-sm"><p className="text-white/55">Next reminder: <span className="text-white">{summary?.reminders.find((item) => !item.completed)?.title ?? "None"}</span></p><p className="text-white/55">Recent service: <span className="text-white">{summary?.services[0]?.title ?? "None"}</span></p></div>}</div>}</WidgetBody><WidgetFooter><Link href="/garage" className="text-xs text-cyan-100 hover:text-white">Open Garage</Link></WidgetFooter></Widget>;
}

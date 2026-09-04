"use client";

import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import type { SchoolSnapshot } from "@/services/school/domain";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { buildAcademicForecast, type AcademicForecastRisk, type AcademicWeekForecast } from "@/services/school/planning/academicForecast";

const panel = "rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75";
const riskStyles: Record<AcademicForecastRisk, string> = { LOW: "border-emerald-200/20 bg-emerald-200/[0.08] text-emerald-100", MODERATE: "border-amber-200/20 bg-amber-200/[0.08] text-amber-100", HIGH: "border-orange-200/25 bg-orange-200/[0.1] text-orange-100", CRITICAL: "border-rose-200/30 bg-rose-200/[0.12] text-rose-100" };
const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
const range = (week: AcademicWeekForecast) => `${week.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${week.weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

function Trend({ trend }: { trend: "STEADY" | "RISING" | "FALLING" }) {
  if (trend === "RISING") return <span className="inline-flex items-center gap-1 text-xs text-orange-100/70"><TrendingUp className="size-3.5" /> Workload rising</span>;
  if (trend === "FALLING") return <span className="inline-flex items-center gap-1 text-xs text-emerald-100/70"><TrendingDown className="size-3.5" /> Workload easing</span>;
  return <span className="text-xs text-white/45">Workload steady</span>;
}

function WeekDetail({ week }: { week: AcademicWeekForecast }) {
  return <div className="space-y-3 border-t border-white/[0.08] px-4 pb-4 pt-3 text-sm text-white/65">
    {week.reasons.length > 0 && <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Why</p><ul className="mt-1 space-y-1">{week.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>}
    {week.majorItems.length > 0 && <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Major work</p><p className="mt-1">{week.majorItems.join(" · ")}</p></div>}
    {(week.examCount > 0 || week.quizCount > 0 || week.projectCount > 0) && <p>{week.examCount ? `${week.examCount} exam${week.examCount === 1 ? "" : "s"}` : ""}{week.quizCount ? `${week.examCount ? " · " : ""}${week.quizCount} quiz${week.quizCount === 1 ? "" : "zes"}` : ""}{week.projectCount ? `${week.examCount || week.quizCount ? " · " : ""}${week.projectCount} project${week.projectCount === 1 ? "" : "s"}` : ""}</p>}
    {week.overdueCarryMinutes > 0 && <p>{formatMinutes(week.overdueCarryMinutes)} overdue carry</p>}
    {week.opportunities.length > 0 && <div className="rounded-xl border border-sky-200/15 bg-sky-200/[0.07] p-3 text-sky-50"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/70">Get ahead</p>{week.opportunities.map((opportunity) => <p key={opportunity.assignmentId} className="mt-1">Do {opportunity.minutes}m of {opportunity.title} earlier. This reduces the later week’s projected load.</p>)}</div>}
    {week.reasons.length === 0 && week.majorItems.length === 0 && week.opportunities.length === 0 && <p className="text-white/40">No unusual pressure signals.</p>}
  </div>;
}

export function AcademicForecastPanel({ snapshot, assignments, now }: { snapshot: SchoolSnapshot; assignments: SchoolPlanningAssignment[]; now: Date }) {
  const forecast = buildAcademicForecast({ ...snapshot, planningAssignments: assignments }, now);
  return <section className={`${panel} overflow-hidden`} aria-labelledby="academic-forecast-title">
    <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/60">Forward-looking workload</p><h2 id="academic-forecast-title" className="mt-1 text-xl font-semibold text-white">Academic forecast · next 6 weeks</h2></div><Trend trend={forecast.summary.trend} /></div>
    <div className="flex snap-x gap-3 overflow-x-auto px-5 pb-5" role="list" aria-label="Academic workload forecast by week">{forecast.weeks.map((week) => <details key={week.weekStart.toISOString()} className={`${riskStyles[week.riskLevel]} min-w-[220px] snap-start overflow-hidden rounded-2xl border`} role="listitem"><summary className="cursor-pointer list-none p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{range(week)}</p><p className="mt-1 text-[11px] uppercase tracking-[0.14em] opacity-70">{week.riskLevel} · {week.assignmentCount} item{week.assignmentCount === 1 ? "" : "s"}</p></div><ChevronDown className="size-4 opacity-60 transition-transform [[open]>&]:rotate-180" /></div><p className="mt-4 text-lg font-semibold">{formatMinutes(week.plannedMinutes)} planned</p><p className="mt-1 text-xs opacity-70">{formatMinutes(week.availableMinutes)} available · {Math.round(week.utilization * 100)}% utilized</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/20" aria-label={`${week.riskLevel} utilization`}><span className="block h-full rounded-full bg-current" style={{ width: `${Math.min(100, Math.round(week.utilization * 100))}%` }} /></div><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-75"><span>{week.deadlineCount} deadline{week.deadlineCount === 1 ? "" : "s"}</span>{week.examCount > 0 && <span>{week.examCount} exam{week.examCount === 1 ? "" : "s"}</span>}{week.projectCount > 0 && <span>{week.projectCount} project{week.projectCount === 1 ? "" : "s"}</span>}</div></summary><WeekDetail week={week} /></details>)}</div>
  </section>;
}

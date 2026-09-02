"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, CheckCircle2, ChevronRight, Clock3, Filter, ListChecks, MapPin, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { Course } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { planAcademicState } from "@/services/school/planning/academicPlanner";
import { useSchool } from "./context/SchoolDataContext";

const panel = "school-command-panel";
const muted = "text-white/45";
const fmtDate = (date?: Date) => date ? date.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "No due date";
const dayKey = (date?: Date) => date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : "none";
const sourceLabel = (source: SchoolPlanningAssignment["sourceType"]) => ({ "canvas-api": "Canvas", "canvas-calendar": "Canvas Calendar", "school-source": "School Source", manual: "Manual" }[source]);
const reasonLabel: Record<string, string> = { DUE_TODAY: "This is due today.", DUE_TOMORROW: "This is due tomorrow.", OVERDUE: "This assignment is already overdue.", HIGH_PRIORITY: "You marked this as high priority.", SHORT_TASK: "This is a known short task.", FITS_AVAILABLE_BLOCK: "This task fits a known available block.", CLASS_SOON: "Your next class starts soon." };

function activeAssignments(items: SchoolPlanningAssignment[]) {
  return items.filter((item) => item.completionStatus !== "completed" && item.completionStatus !== "graded" && item.planningStatus !== "done");
}
function sortAssignments(a: SchoolPlanningAssignment, b: SchoolPlanningAssignment) {
  const aDone = a.completionStatus === "completed" || a.completionStatus === "graded" || a.planningStatus === "done";
  const bDone = b.completionStatus === "completed" || b.completionStatus === "graded" || b.planningStatus === "done";
  if (aDone !== bDone) return aDone ? 1 : -1;
  const now = Date.now();
  const ad = a.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bd = b.dueAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const au = ad < now ? 0 : ad - now < 86_400_000 ? 1 : 2;
  const bu = bd < now ? 0 : bd - now < 86_400_000 ? 1 : 2;
  return au - bu || ad - bd || (b.priority === "critical" ? 1 : b.priority === "high" ? .5 : 0) - (a.priority === "critical" ? 1 : a.priority === "high" ? .5 : 0) || a.title.localeCompare(b.title);
}

function AssignmentRow({ item }: { item: SchoolPlanningAssignment }) {
  const overdue = item.dueAt && item.dueAt < new Date() && item.completionStatus !== "completed" && item.completionStatus !== "graded";
  const complete = item.completionStatus === "completed" || item.completionStatus === "graded" || item.planningStatus === "done";
  return <Link href={`/school/assignments/${encodeURIComponent(item.id)}`} className="group flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 transition hover:bg-white/[0.035]">
    <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${complete ? "bg-emerald-300/10 text-emerald-200" : overdue ? "bg-rose-300/10 text-rose-200" : "bg-sky-300/10 text-sky-100"}`}><CheckCircle2 className="size-4" /></span>
    <span className="min-w-0 flex-1"><span className={`block truncate text-sm font-medium ${complete ? "text-white/45 line-through" : "text-white/85"}`}>{item.title}</span><span className={`mt-1 block truncate text-xs ${muted}`}>{item.courseName ?? "Unknown course"} · {sourceLabel(item.sourceType)}</span></span>
    <span className="hidden shrink-0 text-right sm:block"><span className={`block text-xs ${overdue ? "text-rose-200" : "text-white/65"}`}>{fmtDate(item.dueAt)}</span><span className="mt-1 block text-[11px] text-white/35">{item.estimatedMinutes ? `${item.estimatedMinutes} min` : item.priority !== "normal" ? `${item.priority} priority` : ""}</span></span>
    <ChevronRight className="size-4 shrink-0 text-white/20 transition group-hover:text-white/60" />
  </Link>;
}

function courseName(course: Course) { return course.code ? `${course.code} · ${course.name}` : course.name; }

export function AcademicCommandCenter() {
  const { snapshot, local, loading, recommendationNarration } = useSchool();
  const term = local.data.terms.find((item) => item.active) ?? local.data.terms[0];
  const courses = local.data.courses.filter((course) => !term || course.termId === term.id);
  const assignments = useMemo(() => [...(snapshot?.planningAssignments ?? [])].sort(sortAssignments), [snapshot?.planningAssignments]);
  const recommendations = useMemo(() => snapshot ? planAcademicState(snapshot).recommendations : [], [snapshot]);
  const active = activeAssignments(assignments);
  const today = new Date();
  const dueToday = active.filter((item) => dayKey(item.dueAt) === dayKey(today));
  const overdue = active.filter((item) => item.dueAt && item.dueAt < today);
  const upcoming = active.filter((item) => item.dueAt && item.dueAt >= today);
  const nextClass = local.data.courses.flatMap((course) => course.meetingTimes.map((meeting) => ({ course, meeting }))).sort((a, b) => a.meeting.startTime.localeCompare(b.meeting.startTime))[0];
  const [query, setQuery] = useState("");
  const filtered = assignments.filter((item) => `${item.title} ${item.courseName ?? ""} ${sourceLabel(item.sourceType)}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12);

  if (loading) return <div className="py-16 text-sm text-white/50">Loading your academic command center…</div>;
  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/55">Academic command center</p><h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-white">{term?.name ?? "School"}</h1><p className="mt-2 text-sm text-white/45">{today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {active.length} active assignments</p></div><div className="flex gap-2"><Link href="/school/assignments" className="inline-flex items-center gap-2 rounded-xl bg-sky-200/15 px-3.5 py-2.5 text-sm font-semibold text-sky-50 hover:bg-sky-200/25"><ListChecks className="size-4" /> View all assignments</Link></div></header>
    <section className={`${panel} border-sky-200/15 bg-sky-200/[0.06] p-5`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/65">What should I do now?</p><h2 className="mt-2 text-xl font-semibold text-white">{recommendations[0]?.title ?? "You have no urgent academic work."}</h2>{recommendations[0]?.courseId && <p className="mt-1 text-xs text-sky-100/55">{local.data.courses.find((course) => course.id === recommendations[0].courseId)?.name ?? recommendations[0].courseId}</p>}<p className="mt-2 text-sm text-white/55">{recommendations[0]?.explanation ?? "Your School plan is clear for the moment."}</p></div>{recommendations[0]?.assignmentId && <Link href={`/school/assignments/${encodeURIComponent(recommendations[0].assignmentId)}`} className="rounded-xl bg-sky-100 px-3.5 py-2.5 text-sm font-semibold text-slate-950">Open task</Link>}</div><p className="mt-4 border-t border-white/[0.08] pt-3 text-sm leading-6 text-white/65"><span className="mr-2 text-xs uppercase tracking-wider text-sky-100/45">Cosmic&apos;s take</span>{recommendationNarration?.text ?? recommendations[0]?.explanation ?? "Your School plan is clear for the moment."}</p>{recommendations[0] && <details className="mt-3"><summary className="cursor-pointer text-sm text-sky-100/75">Why this?</summary><ul className="mt-2 space-y-1 text-xs text-white/55">{recommendations[0].reasonCodes.map((code) => <li key={code}>{reasonLabel[code] ?? code}</li>)}</ul></details>}{recommendations.length > 1 && <div className="mt-5 border-t border-white/[0.08] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Next up</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{recommendations.slice(1, 4).map((item) => <p key={item.id} className="text-sm text-white/70">{item.title}<span className="ml-2 text-xs text-white/35">{item.explanation}</span></p>)}</div></div>}</section>
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Due today" value={dueToday.length} tone="text-amber-100" /><Metric label="Overdue" value={overdue.length} tone="text-rose-200" /><Metric label="This week" value={upcoming.filter((item) => item.dueAt!.getTime() < today.getTime() + 7 * 86_400_000).length} tone="text-sky-100" /></section>
    <section className="grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
      <div className={`${panel} overflow-hidden`}><div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">Today</p><h2 className="mt-1 text-xl font-semibold text-white">What needs your attention</h2></div><Sparkles className="size-5 text-sky-200/55" /></div><div className="divide-y divide-white/[0.06] px-4 py-3">{dueToday.slice(0, 4).map((item) => <div key={item.id} className="flex items-center gap-3 py-2"><span className="size-2 rounded-full bg-amber-200" /><span className="min-w-0 flex-1 truncate text-sm text-white/80">{item.title}</span><span className="text-xs text-white/40">{item.courseName ?? "Unknown course"}</span></div>)}{overdue.slice(0, 3).map((item) => <div key={`overdue-${item.id}`} className="flex items-center gap-3 py-2"><span className="size-2 rounded-full bg-rose-300" /><span className="min-w-0 flex-1 truncate text-sm text-white/80">{item.title}</span><span className="text-xs text-rose-200/75">Overdue</span></div>)}{!dueToday.length && !overdue.length && <p className="py-4 text-sm text-white/45">You have no urgent assignments. Nice margin.</p>}</div></div>
      <div className={`${panel} p-5`}><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">Next class</p>{nextClass ? <><h2 className="mt-3 text-lg font-semibold text-white">{courseName(nextClass.course)}</h2><p className="mt-2 flex items-center gap-2 text-sm text-white/55"><Clock3 className="size-4" /> {nextClass.meeting.startTime}–{nextClass.meeting.endTime}</p><p className="mt-2 flex items-center gap-2 text-sm text-white/55"><MapPin className="size-4" /> {nextClass.meeting.location ?? nextClass.course.location ?? "Not specified"}</p></> : <p className="mt-3 text-sm text-white/45">No class meetings configured.</p>}<Link href="/school/schedule" className="mt-5 inline-flex items-center gap-1 text-sm text-sky-100/75 hover:text-white">Open schedule <ChevronRight className="size-4" /></Link></div>
    </section>
    <section className={`${panel} overflow-hidden`}><div className="flex flex-col gap-3 border-b border-white/[0.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">Up next</p><h2 className="mt-1 text-xl font-semibold text-white">Assignment queue</h2></div><label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white/55"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assignments" className="w-44 bg-transparent text-white outline-none placeholder:text-white/30" /></label></div>{filtered.length ? filtered.map((item) => <AssignmentRow key={`${item.sourceType}:${item.id}`} item={item} />) : <p className="p-5 text-sm text-white/45">No assignments found in the normalized School data.</p>}<div className="flex items-center justify-between px-4 py-3"><span className="text-xs text-white/35">Showing {filtered.length} of {assignments.length} assignments</span><Link href="/school/assignments" className="text-sm text-sky-100/75 hover:text-white">Open assignment manager →</Link></div></section>
    <section><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">Your schedule</p><h2 className="mt-1 text-xl font-semibold text-white">Courses</h2></div><Link href="/school/courses" className="text-sm text-sky-100/70">Manage courses →</Link></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => { const mine = assignments.filter((item) => item.courseId === course.id || item.courseName === course.name || item.courseName === course.code); const open = activeAssignments(mine); return <Link key={course.id} href={`/school/courses/${encodeURIComponent(course.id)}`} className={`${panel} group p-4 transition hover:-translate-y-0.5 hover:border-sky-200/25`}><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-xl bg-sky-300/10 text-sky-100"><BookOpen className="size-4" /></span><ChevronRight className="size-4 text-white/20 group-hover:text-white/70" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-sky-100/55">{course.code ?? "Course"}</p><h3 className="mt-1 line-clamp-2 font-semibold text-white">{course.name}</h3><p className="mt-3 text-xs text-white/45">{open.length} active · {mine.length - open.length} completed</p><p className="mt-1 truncate text-xs text-white/35">{course.instructor ?? "Instructor not specified"}</p></Link>})}{!courses.length && <div className={`${panel} p-5 text-sm text-white/45`}>No courses configured for the active term. <Link className="text-sky-100/75" href="/school/settings">Set up School →</Link></div>}</div></section>
    <div className="flex flex-wrap gap-3 text-xs text-white/35"><span className="inline-flex items-center gap-1.5"><Filter className="size-3.5" /> Sources stay attached to every assignment</span><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" /> Provider deadlines are read-only</span></div>
  </div>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className={`${panel} p-4`}><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</p><p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p></div>; }

export function SchoolAssignmentsCommand() {
  const { snapshot, loading } = useSchool();
  const [view, setView] = useState("All");
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const items = useMemo(() => [...(snapshot?.planningAssignments ?? [])].sort(sortAssignments), [snapshot?.planningAssignments]);
  const now = new Date();
  const shown = items.filter((item) => { const done = item.completionStatus === "completed" || item.completionStatus === "graded" || item.planningStatus === "done"; const week = item.dueAt && item.dueAt.getTime() <= now.getTime() + 7 * 86_400_000; const match = `${item.title} ${item.courseName ?? ""} ${sourceLabel(item.sourceType)}`.toLowerCase().includes(query.toLowerCase()); if (!match || (courseFilter !== "all" && item.courseName !== courseFilter) || (sourceFilter !== "all" && item.sourceType !== sourceFilter)) return false; return view === "All" || view === "Completed" && done || view === "Overdue" && !done && !!item.dueAt && item.dueAt < now || view === "Due soon" && !done && !!item.dueAt && item.dueAt >= now && week || view === "No due date" && !done && !item.dueAt; });
  const courseOptions = [...new Set(items.map((item) => item.courseName).filter(Boolean))] as string[];
  if (loading) return <div className="py-16 text-sm text-white/50">Loading assignments…</div>;
  return <div className="space-y-5"><header><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/55">School / Assignments</p><h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-white">Assignment manager</h1><p className="mt-2 text-sm text-white/45">{items.length} normalized assignments · provider status and Cosmic planning stay separate</p></header><div className={`${panel} flex flex-col gap-3 p-3`}><div className="flex flex-wrap gap-2">{["All", "Due soon", "Overdue", "No due date", "Completed"].map((label) => <button key={label} onClick={() => setView(label)} className={`rounded-lg px-3 py-2 text-xs ${view === label ? "bg-sky-200/15 text-sky-50" : "text-white/45 hover:bg-white/[0.05]"}`}>{label}</button>)}</div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white/55"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, course, source" className="w-full bg-transparent text-white outline-none placeholder:text-white/30 sm:w-56" /></label><select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 text-sm text-white/65"><option value="all">All courses</option>{courseOptions.map((course) => <option key={course} value={course}>{course}</option>)}</select><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 text-sm text-white/65"><option value="all">All sources</option>{["canvas-api", "canvas-calendar", "school-source", "manual"].map((source) => <option key={source} value={source}>{sourceLabel(source as SchoolPlanningAssignment["sourceType"])}</option>)}</select></div></div><div className={`${panel} overflow-hidden`}>{shown.length ? shown.map((item) => <AssignmentRow key={`${item.sourceType}:${item.id}`} item={item} />) : <p className="p-8 text-center text-sm text-white/45">No assignments match this view.</p>}</div></div>;
}

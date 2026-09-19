"use client";

import Link from "next/link";
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import type { Course } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { useSchool } from "./context/SchoolDataContext";
import { localAssignmentToPlanning } from "@/services/school/semesterConsumers";
import { buildSchoolCourseCatalog } from "@/services/school/courseIdentity";
import { getSchoolSetupState } from "@/services/school/courseExperience";
import { buildTodayAcademicView, resolveTodayAssignmentCourseId, resolveTodayEventCourseId, type TodayScheduleItem } from "@/services/school/today";
import { AfrotcOpordCard } from "./AfrotcOpordCard";

const panel = "rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75";
const dateLabel = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const timeLabel = (date: Date) => date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const courseLabel = (course: Course) => course.code ? `${course.code} · ${course.name}` : course.name;

function assignmentDueLabel(item: SchoolPlanningAssignment, now: Date) {
  if (!item.dueAt) return "Due date unavailable";
  if (item.dueAt.toDateString() === now.toDateString()) return `Today · ${timeLabel(item.dueAt)}`;
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  if (item.dueAt.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${timeLabel(item.dueAt)}`;
  return `${dateLabel(item.dueAt)} · ${timeLabel(item.dueAt)}`;
}

function AssignmentRow({ item, now, catalog, courses }: { item: SchoolPlanningAssignment; now: Date; catalog: ReturnType<typeof buildSchoolCourseCatalog>; courses: Course[] }) {
  const identityId = resolveTodayAssignmentCourseId(item, catalog, courses);
  const identity = catalog.find((item) => item.id === identityId);
  const courseName = item.courseName ?? identity?.name ?? "Course not specified";
  return <div className="flex min-w-0 items-center gap-3 border-t border-white/[0.07] px-4 py-3 sm:px-5">
    <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-sky-200/70" />
    <Link href={`/school/assignments/${encodeURIComponent(item.id)}`} className="min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
      <span className="block truncate text-sm text-white/85">{item.title}</span>
      <span className="mt-1 block truncate text-xs text-white/45">{courseName} · {item.sourceType === "canvas-api" || item.sourceType === "canvas-calendar" ? "Canvas" : "Manual"}</span>
    </Link>
    {identity && <Link aria-label={`Open ${identity.name}`} href={`/school/courses/${encodeURIComponent(identity.id)}`} className="hidden rounded-lg px-2 py-1 text-xs text-sky-100/65 hover:bg-white/[0.05] hover:text-white sm:block">Course</Link>}
    <span className={`shrink-0 text-right text-xs ${item.dueAt && item.dueAt < now ? "text-amber-100" : "text-white/55"}`}>{assignmentDueLabel(item, now)}</span>
  </div>;
}

function ScheduleRow({ item, catalog }: { item: TodayScheduleItem; catalog: ReturnType<typeof buildSchoolCourseCatalog> }) {
  const identityId = item.kind === "event" ? resolveTodayEventCourseId({ courseId: item.courseId, course: item.courseName }, catalog) : undefined;
  const resolved = catalog.find((identity) => identity.id === identityId);
  const title = item.kind === "class" ? courseLabel(item.course) : item.title;
  return <div className="flex items-center gap-3 border-t border-white/[0.07] px-4 py-3 sm:px-5">
    {item.kind === "class" ? <Clock3 aria-hidden="true" className="size-4 shrink-0 text-sky-200/70" /> : <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-violet-200/70" />}
    <div className="min-w-0 flex-1">
      {item.kind === "class" ? <Link href={`/school/courses/${encodeURIComponent(item.course.id)}`} className="block truncate text-sm text-white/80 hover:text-white">{title}</Link> : resolved ? <Link href={`/school/courses/${encodeURIComponent(resolved.id)}`} className="block truncate text-sm text-white/80 hover:text-white">{title}</Link> : <p className="truncate text-sm text-white/80">{title}</p>}
      {item.location && <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/40"><MapPin aria-hidden="true" className="size-3" />{item.location}</p>}
    </div>
    <span className="shrink-0 text-right text-xs text-white/55">{timeLabel(item.start)}{item.kind === "class" || item.end > item.start ? `–${timeLabel(item.end)}` : ""}</span>
  </div>;
}

export function AcademicCommandCenterHome() {
  const { snapshot, local, loading } = useSchool();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  const term = local.data.terms.find((item) => item.active) ?? local.data.terms[0];
  const courses = local.data.courses.filter((course) => !term || course.termId === term.id);
  const catalog = buildSchoolCourseCatalog(courses, local.data.terms, snapshot?.canvasCourses ?? []);
  const localCoursesById = new Map(courses.map((course) => [course.id, course]));
  const assignments = [...(snapshot?.planningAssignments ?? []), ...local.data.assignments.map((item) => localAssignmentToPlanning(item, item.courseId ? localCoursesById.get(item.courseId) : undefined))];
  const view = buildTodayAcademicView({ courses, term, catalog, assignments, events: snapshot?.events ?? [], now });
  const setupState = getSchoolSetupState(local.data, snapshot);
  const hasMeaningfulData = catalog.length > 0 || assignments.length > 0 || (snapshot?.events.length ?? 0) > 0;
  const providerError = snapshot?.sourceStatus?.canvas === "error";
  if (loading) return <div aria-label="Loading School" className="space-y-4"><div className={`${panel} h-28 animate-pulse bg-white/[0.03]`} /><div className={`${panel} h-64 animate-pulse bg-white/[0.03]`} /></div>;

  const nextAssignment = view.nextAssignment;
  const nextScheduleItem = view.nextScheduleItem;
  const upNext = nextAssignment && (!nextScheduleItem || nextAssignment.dueAt && nextAssignment.dueAt <= nextScheduleItem.start)
    ? { kind: "assignment" as const, item: nextAssignment }
    : nextScheduleItem ? { kind: "schedule" as const, item: nextScheduleItem }
      : nextAssignment ? { kind: "assignment" as const, item: nextAssignment } : undefined;
  const noTodayItems = !view.dueTodayAssignments.length && !view.schedule.length;

  return <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200/60">Cosmic School{term ? ` · ${term.name}` : ""}</p><h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Today</h1><p className="mt-2 text-sm text-white/50">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {view.dueTodayAssignments.length} due today · {view.schedule.length} classes/events</p></div>
      <nav aria-label="School sections" className="flex flex-wrap gap-2"><Link href="/school/courses" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05]">Courses</Link><Link href="/school/assignments" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05]">Assignments</Link><Link href="/school/calendar" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05]">Calendar</Link></nav>
    </header>

    {!hasMeaningfulData && setupState !== "provider_error" && <section className={`${panel} border-sky-200/15 p-5`} aria-labelledby="school-start-title"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/65">A clear start</p><h2 id="school-start-title" className="mt-1 text-lg font-semibold text-white">Your academic day will show up here</h2><p className="mt-1 max-w-2xl text-sm text-white/50">Add a course or assignment manually, or connect a school provider where available. Your School workspace works without a provider.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/school/courses" className="rounded-xl bg-sky-200/15 px-3 py-2 text-sm font-semibold text-sky-50">Add a course</Link><Link href="/school/assignments" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Add an assignment</Link><Link href="/school/settings" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Connect a provider</Link></div></section>}

    {(view.overdueAssignments.length > 0 || providerError) && <section className={`${panel} border-amber-200/20 p-4 sm:p-5`} aria-labelledby="needs-attention-title"><div className="flex items-start gap-3"><AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-100/80" /><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/65">Needs attention</p><h2 id="needs-attention-title" className="mt-1 text-lg font-semibold text-white">A few things need a look</h2></div></div>{providerError && <p className="mt-3 text-sm text-amber-50/70">The connected school source could not be refreshed. Your saved local courses and work remain available; reconnect from <Link href="/school/settings" className="underline underline-offset-2">School settings</Link> when convenient.</p>}{view.overdueAssignments.slice(0, 4).map((item) => <AssignmentRow key={item.id} item={item} now={now} catalog={catalog} courses={courses} />)}</section>}

    <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]" aria-label="Today's academic priorities">
      <article className={`${panel} overflow-hidden`} aria-labelledby="today-work-title"><div className="p-4 sm:p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/65">Due today</p><h2 id="today-work-title" className="mt-1 text-xl font-semibold text-white">Work for today</h2></div>{view.dueTodayAssignments.map((item) => <AssignmentRow key={item.id} item={item} now={now} catalog={catalog} courses={courses} />)}{!view.dueTodayAssignments.length && <p className="px-4 pb-5 text-sm text-white/45 sm:px-5">No assignments are due today.</p>}</article>
      <article className={`${panel} overflow-hidden`} aria-labelledby="today-schedule-title"><div className="p-4 sm:p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/65">Classes and events</p><h2 id="today-schedule-title" className="mt-1 text-xl font-semibold text-white">Today&apos;s schedule</h2></div>{view.schedule.map((item) => <ScheduleRow key={`${item.kind}:${item.id}`} item={item} catalog={catalog} />)}{!view.schedule.length && <p className="px-4 pb-5 text-sm text-white/45 sm:px-5">No classes or academic events scheduled today.</p>}</article>
    </section>

    <section className={`${panel} border-emerald-200/15 p-4 sm:p-5`} aria-labelledby="up-next-title"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/65">Up next · based on your dates and schedule</p><h2 id="up-next-title" className="mt-1 text-xl font-semibold text-white">Your next useful step</h2>{upNext?.kind === "assignment" ? <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="min-w-0"><Link href={`/school/assignments/${encodeURIComponent(upNext.item.id)}`} className="font-medium text-white hover:underline">{upNext.item.title}</Link><p className="mt-1 text-sm text-white/50">{upNext.item.dueAt && upNext.item.dueAt < now ? "Overdue" : assignmentDueLabel(upNext.item, now)}{upNext.item.courseName ? ` · ${upNext.item.courseName}` : ""}</p></div><Link href={`/school/assignments/${encodeURIComponent(upNext.item.id)}`} className="shrink-0 rounded-xl bg-emerald-100/10 px-3 py-2 text-sm text-emerald-50">Open assignment</Link></div> : upNext?.kind === "schedule" ? <div className="mt-3"><p className="font-medium text-white">{upNext.item.kind === "class" ? courseLabel(upNext.item.course) : upNext.item.title}</p><p className="mt-1 text-sm text-white/50">{upNext.item.kind === "class" ? "Next class" : "Next academic event"} · {dateLabel(upNext.item.start)} at {timeLabel(upNext.item.start)}</p></div> : <p className="mt-2 text-sm text-white/50">No dated work or upcoming class is available to recommend.</p>}</section>

    <section className={`${panel} overflow-hidden`} aria-labelledby="coming-up-title"><div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/60">Coming up</p><h2 id="coming-up-title" className="mt-1 text-xl font-semibold text-white">Next 7 days</h2></div><Link href="/school/calendar" className="text-sm text-sky-100/70 hover:text-white">Open calendar</Link></div>{view.upcomingAssignments.slice(0, 5).map((item) => <AssignmentRow key={item.id} item={item} now={now} catalog={catalog} courses={courses} />)}{view.comingEvents.slice(0, 4).map((item) => <div key={`${item.source}:${item.id}`} className="flex items-center gap-3 border-t border-white/[0.07] px-4 py-3 sm:px-5"><CalendarDays aria-hidden="true" className="size-4 shrink-0 text-violet-200/70" /><span className="min-w-0 flex-1 truncate text-sm text-white/80">{item.title}</span><span className="shrink-0 text-right text-xs text-white/50">{dateLabel(item.start)} · {timeLabel(item.start)}</span></div>)}{!view.upcomingAssignments.length && !view.comingEvents.length && <p className="px-4 pb-5 text-sm text-white/45 sm:px-5">Nothing else is due or scheduled in the next 7 days.</p>}</section>

    {noTodayItems && hasMeaningfulData && <p className="text-center text-xs text-white/35">Today&apos;s schedule is clear. Check what&apos;s coming up above when you&apos;re ready.</p>}
    <AfrotcOpordCard />
  </div>;
}

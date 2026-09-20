"use client";

import Link from "next/link";
import { AlertCircle, BookOpen, CalendarDays, CheckCircle2, Clock3, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import type { Course } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { useSchool } from "./context/SchoolDataContext";
import { localAssignmentToPlanning } from "@/services/school/semesterConsumers";
import { buildSchoolCourseCatalog } from "@/services/school/courseIdentity";
import { buildTodayAcademicView, resolveTodayAssignmentCourseId, resolveTodayEventCourseId, type TodayNextStep, type TodayScheduleItem } from "@/services/school/today";
import { AfrotcOpordCard } from "./AfrotcOpordCard";

const panel = "rounded-[1.25rem] border border-white/[0.09] bg-[#101c35]/75";
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

function AssignmentRow({ item, now, catalog, courses, reason }: { item: SchoolPlanningAssignment; now: Date; catalog: ReturnType<typeof buildSchoolCourseCatalog>; courses: Course[]; reason: string }) {
  const identityId = resolveTodayAssignmentCourseId(item, catalog, courses);
  const identity = catalog.find((course) => course.id === identityId);
  const courseName = identity ? (identity.code ? `${identity.code} · ${identity.name}` : identity.name) : item.courseName ?? "Course not specified";
  const provider = item.sourceType === "canvas-api" || item.sourceType === "canvas-calendar";
  return <div className="flex min-w-0 items-center gap-3 border-t border-white/[0.07] px-4 py-3 sm:px-5">
    <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-sky-200/70" />
    <Link href={`/school/assignments/${encodeURIComponent(item.id)}`} className="min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-200">
      <span className="block truncate text-sm text-white/85">{item.title}</span>
      <span className="mt-1 block truncate text-xs text-white/45">{courseName} · {reason} · {provider ? "Canvas" : "Manual"}</span>
    </Link>
    {identity && <Link aria-label={`Open ${identity.name}`} href={`/school/courses/${encodeURIComponent(identity.id)}`} className="hidden rounded-lg px-2 py-1 text-xs text-sky-100/65 hover:bg-white/[0.05] hover:text-white sm:block">Course</Link>}
    <span className={`shrink-0 text-right text-xs ${item.dueAt && item.dueAt < now ? "text-amber-100" : "text-white/55"}`}>{assignmentDueLabel(item, now)}</span>
  </div>;
}

function ScheduleRow({ item, catalog }: { item: TodayScheduleItem; catalog: ReturnType<typeof buildSchoolCourseCatalog> }) {
  const identityId = item.kind === "event" ? resolveTodayEventCourseId({ courseId: item.courseId, course: item.courseName }, catalog) : undefined;
  const identity = catalog.find((course) => course.id === identityId);
  const title = item.kind === "class" ? courseLabel(item.course) : item.title;
  const courseName = item.kind === "event" ? identity ? (identity.code ? `${identity.code} · ${identity.name}` : identity.name) : item.courseName : undefined;
  return <div className="flex min-w-0 items-center gap-3 border-t border-white/[0.07] px-4 py-3 sm:px-5">
    {item.kind === "class" ? <Clock3 aria-hidden="true" className="size-4 shrink-0 text-sky-200/70" /> : <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-violet-200/70" />}
    <div className="min-w-0 flex-1">
      {item.kind === "class" ? <Link href={`/school/courses/${encodeURIComponent(item.course.id)}`} className="block truncate text-sm text-white/80 hover:text-white">{title}</Link> : identity ? <Link href={`/school/courses/${encodeURIComponent(identity.id)}`} className="block truncate text-sm text-white/80 hover:text-white">{title}</Link> : <p className="truncate text-sm text-white/80">{title}</p>}
      {(courseName || item.location) && <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 truncate text-xs text-white/40">{courseName && <span className="truncate">{courseName}</span>}{item.location && <span className="inline-flex min-w-0 items-center gap-1 truncate"><MapPin aria-hidden="true" className="size-3 shrink-0" />{item.location}</span>}</p>}
    </div>
    <span className="shrink-0 text-right text-xs text-white/55">{item.kind === "event" && item.allDay ? "All day" : `${timeLabel(item.start)}${item.kind === "class" || item.end > item.start ? `–${timeLabel(item.end)}` : ""}`}</span>
  </div>;
}

function NextStep({ step, now, catalog, courses }: { step: TodayNextStep; now: Date; catalog: ReturnType<typeof buildSchoolCourseCatalog>; courses: Course[] }) {
  if (!step) return <p className="mt-2 text-sm text-white/50">No urgent work or due Study reviews are available right now.</p>;
  if (step.kind === "attention") return <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-white/65">Start with one of the items listed in Needs Attention.</p><Link href={`/school/assignments/${encodeURIComponent(step.item.id)}`} className="shrink-0 rounded-xl bg-emerald-100/10 px-3 py-2 text-sm text-emerald-50">Open first item</Link></div>;
  if (step.kind === "study") return <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-white/65">Review the due cards listed below.</p><Link href={`/school/study/sets/${encodeURIComponent(step.review.setId)}`} className="shrink-0 rounded-xl bg-emerald-100/10 px-3 py-2 text-sm text-emerald-50">Open Study</Link></div>;
  const identityId = resolveTodayAssignmentCourseId(step.item, catalog, courses);
  const identity = catalog.find((course) => course.id === identityId);
  const reason = step.kind === "planner" ? step.reason : step.item.dueAt ? assignmentDueLabel(step.item, now) : "Upcoming assignment";
  return <div className="mt-3 flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="min-w-0"><Link href={`/school/assignments/${encodeURIComponent(step.item.id)}`} className="font-medium text-white hover:underline">{step.item.title}</Link><p className="mt-1 truncate text-sm text-white/50">{reason}{identity ? ` · ${identity.code ? `${identity.code} · ` : ""}${identity.name}` : step.item.courseName ? ` · ${step.item.courseName}` : ""}</p></div><Link href={`/school/assignments/${encodeURIComponent(step.item.id)}`} className="shrink-0 rounded-xl bg-emerald-100/10 px-3 py-2 text-sm text-emerald-50">Open assignment</Link></div>;
}

export function AcademicCommandCenterHome() {
  const { snapshot, local, loading, error } = useSchool();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  const term = local.data.terms.find((item) => item.active) ?? local.data.terms[0];
  const courses = local.data.courses.filter((course) => !term || course.termId === term.id);
  const catalog = buildSchoolCourseCatalog(courses, local.data.terms, snapshot?.canvasCourses ?? []);
  const localCoursesById = new Map(courses.map((course) => [course.id, course]));
  const assignments = [...(snapshot?.planningAssignments ?? []), ...local.data.assignments.map((item) => localAssignmentToPlanning(item, item.courseId ? localCoursesById.get(item.courseId) : undefined))];
  const providerUnavailable = Boolean(error || snapshot?.sourceStatus?.canvas === "error");
  const view = buildTodayAcademicView({ courses, term, catalog, assignments, events: snapshot?.events ?? [], studySets: local.data.studySets ?? [], flashcards: local.data.flashcards ?? [], planningRecommendations: snapshot?.planningRecommendations, providerUnavailable, now });
  const localDataAvailable = courses.length > 0 || local.data.assignments.length > 0 || (local.data.studySets?.length ?? 0) > 0;
  const hasMeaningfulData = catalog.length > 0 || assignments.length > 0 || (snapshot?.events.length ?? 0) > 0 || view.totalStudyReviewsDue > 0;
  const providerMessage = providerUnavailable ? localDataAvailable ? "Canvas data is temporarily unavailable. Showing your local School data." : "Canvas data is temporarily unavailable. You can add courses and assignments locally." : "";
  if (loading || !local.ready) return <div aria-label="Loading School" className="space-y-4"><div className={`${panel} h-24 animate-pulse bg-white/[0.03]`} /><div className={`${panel} h-48 animate-pulse bg-white/[0.03]`} /></div>;

  return <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200/60">Cosmic School{term ? ` · ${term.name}` : ""}</p><h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Today</h1><p className="mt-2 text-sm text-white/50">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {view.needsAttentionAssignments.length} {view.needsAttentionAssignments.length === 1 ? "assignment" : "assignments"} need attention · {view.schedule.length} scheduled {view.schedule.length === 1 ? "item" : "items"} today</p></div>
      <nav aria-label="School sections" className="flex flex-wrap gap-2"><Link href="/school/courses" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05]">Courses</Link><Link href="/school/assignments" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05]">Assignments</Link><Link href="/school/calendar" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.05]">Calendar</Link></nav>
    </header>

    {providerMessage && <p role="status" className="rounded-xl border border-amber-200/15 bg-amber-100/[0.04] px-4 py-3 text-sm text-amber-50/75">{providerMessage}</p>}

    <section className={`${panel} overflow-hidden`} aria-labelledby="needs-attention-title"><div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5"><div className="flex items-start gap-3"><AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-100/80" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/65">Needs attention</p><h2 id="needs-attention-title" className="mt-1 text-lg font-semibold text-white">{view.needsAttentionAssignments.length ? `${view.needsAttentionAssignments.length} assignment${view.needsAttentionAssignments.length === 1 ? "" : "s"} to review` : "Nothing needs immediate attention."}</h2></div></div>{view.needsAttentionAssignments.length > 4 && <Link href="/school/assignments" className="text-sm text-sky-100/70">All assignments</Link>}</div>{view.needsAttentionAssignments.slice(0, 5).map((item) => <AssignmentRow key={item.id} item={item} now={now} catalog={catalog} courses={courses} reason={item.dueAt && item.dueAt < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? "Overdue" : "Due today"} />)}</section>

    <section className={`${panel} overflow-hidden`} aria-labelledby="today-schedule-title"><div className="flex flex-wrap items-end justify-between gap-2 p-4 sm:p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/65">Today</p><h2 id="today-schedule-title" className="mt-1 text-xl font-semibold text-white">Today&apos;s schedule</h2></div><Link href="/school/calendar" className="text-sm text-sky-100/70 hover:text-white">Open Calendar</Link></div>{view.schedule.map((item) => <ScheduleRow key={`${item.kind}:${item.id}`} item={item} catalog={catalog} />)}{!view.schedule.length && <p className="px-4 pb-5 text-sm text-white/45 sm:px-5">No scheduled academic events found for today.</p>}</section>

    <section className={`${panel} border-emerald-200/15 p-4 sm:p-5`} aria-labelledby="up-next-title"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/65">Up next · based on your dates and saved reviews</p><h2 id="up-next-title" className="mt-1 text-xl font-semibold text-white">What to work on next</h2><NextStep step={view.nextStep} now={now} catalog={catalog} courses={courses} /></section>

    {view.studyReviews.length > 0 && <section className={`${panel} overflow-hidden`} aria-labelledby="study-today-title"><div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/60">Study</p><h2 id="study-today-title" className="mt-1 text-xl font-semibold text-white">{view.totalStudyReviewsDue} {view.totalStudyReviewsDue === 1 ? "card" : "cards"} ready for review</h2></div><Link href="/school/study" className="text-sm text-sky-100/70 hover:text-white">Open Study</Link></div>{view.studyReviews.slice(0, 3).map((item) => <div key={item.setId} className="flex min-w-0 items-center gap-3 border-t border-white/[0.07] px-4 py-3 sm:px-5"><BookOpen aria-hidden="true" className="size-4 shrink-0 text-sky-200/70" /><div className="min-w-0 flex-1"><Link href={`/school/study/sets/${encodeURIComponent(item.setId)}`} className="block truncate text-sm text-white/85">{item.title}</Link><p className="mt-1 truncate text-xs text-white/45">{item.dueCount} {item.dueCount === 1 ? "card" : "cards"} due{item.courseName ? ` · ${item.courseName}` : ""}</p></div><Link href={`/school/study/sets/${encodeURIComponent(item.setId)}`} className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.05]">Review</Link></div>)}</section>}

    <section className={`${panel} overflow-hidden`} aria-labelledby="coming-up-title"><div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/60">Coming up</p><h2 id="coming-up-title" className="mt-1 text-xl font-semibold text-white">After today</h2></div><div className="flex gap-4"><Link href="/school/assignments" className="text-sm text-sky-100/70 hover:text-white">Assignments</Link><Link href="/school/calendar" className="text-sm text-sky-100/70 hover:text-white">Calendar</Link></div></div>{view.comingUpAssignments.slice(0, 3).map((item) => <AssignmentRow key={item.id} item={item} now={now} catalog={catalog} courses={courses} reason="Due soon" />)}{view.comingSchedule.slice(0, 3).map((item) => <ScheduleRow key={`coming:${item.kind}:${item.id}`} item={item} catalog={catalog} />)}{!view.comingUpAssignments.length && !view.comingSchedule.length && <p className="px-4 pb-5 text-sm text-white/45 sm:px-5">Nothing else is due or scheduled in the next 7 days.</p>}</section>

    {!hasMeaningfulData && <section className={`${panel} p-4 sm:p-5`}><p className="text-sm text-white/65">You&apos;re caught up with the School information currently available.</p><div className="mt-3 flex flex-wrap gap-2"><Link href="/school/courses" className="rounded-xl bg-sky-200/15 px-3 py-2 text-sm font-semibold text-sky-50">Add a course</Link><Link href="/school/assignments" className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Add an assignment</Link></div></section>}
    <AfrotcOpordCard />
  </div>;
}

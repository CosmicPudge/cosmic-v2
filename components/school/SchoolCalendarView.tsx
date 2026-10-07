"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, MapPin } from "lucide-react";
import { useState } from "react";
import { useSchool } from "./context/SchoolDataContext";
import { getSchoolWeek, localAssignmentToPlanning } from "@/services/school/semesterConsumers";
import { buildSchoolCourseCatalog } from "@/services/school/courseIdentity";
import { assignmentBelongsToCourse, calendarCourseFilterSelection, timelineEntryBelongsToCourse } from "@/services/school/courseExperience";
import { schoolCalendarItemHref } from "@/services/school/studentDemoPresentation";
import SchoolTabs from "./SchoolTabs";

const panel = "rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75";
const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type CalendarItem = { id: string; start: Date; end?: Date; title: string; course?: string; courseId?: string; kind: "CLASS" | "DUE" | "EVENT"; location?: string };
const clock = (value: Date) => value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const shortDate = (value: Date) => value.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function SchoolCalendarView() {
  const { snapshot, local, loading } = useSchool();
  const [now] = useState(() => new Date());
  const requestedCourseId = useSearchParams().get("course");
  const [manualCourseId, setManualCourseId] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [visible, setVisible] = useState({ CLASS: true, DUE: true, EVENT: true });
  const term = local.data.terms.find((item) => item.active) ?? local.data.terms[0];
  const courses = local.data.courses.filter((course) => !term || course.termId === term.id);
  const catalog = buildSchoolCourseCatalog(courses, local.data.terms, snapshot?.canvasCourses ?? []);
  const courseId = calendarCourseFilterSelection(requestedCourseId, catalog, local.ready && !loading, manualCourseId);
  const selectedIdentity = catalog.find((identity) => identity.id === courseId);
  const selectedLocalCourse = selectedIdentity?.localCourseId ? courses.find((course) => course.id === selectedIdentity.localCourseId) : undefined;
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const assignments = [...(snapshot?.planningAssignments ?? []), ...local.data.assignments.map((item) => localAssignmentToPlanning(item, item.courseId ? courseMap.get(item.courseId) : undefined))];
  const week = getSchoolWeek(courses, term, assignments, snapshot?.events ?? [], now);
  const assignmentMatches = (item: (typeof assignments)[number]) => Boolean(selectedIdentity && assignmentBelongsToCourse(item, selectedIdentity, selectedLocalCourse));
  const eventMatches = (item: (typeof week.events)[number]) => Boolean(selectedIdentity && timelineEntryBelongsToCourse({ sourceId: item.courseId, courseName: item.course }, selectedIdentity));
  const meetingMatches = (item: (typeof week.meetings)[number]) => Boolean(selectedIdentity?.localCourseId === item.course.id);
  const filteredMeetings = courseId === "all" ? week.meetings : week.meetings.filter(meetingMatches);
  const filteredAssignments = courseId === "all" ? week.assignments : week.assignments.filter(assignmentMatches);
  const filteredEvents = courseId === "all" ? week.events : week.events.filter(eventMatches);
  const selectedDay = selected === 6 ? 0 : selected + 1;
  const dayItems: CalendarItem[] = [
    ...(visible.CLASS ? filteredMeetings.filter((item) => item.start.getDay() === selectedDay).map((item) => ({ id: item.id, start: item.start, end: item.end, title: item.course.name, course: item.course.code, courseId: item.course.id, kind: "CLASS" as const, location: item.meeting.location ?? item.course.location })) : []),
    ...(visible.DUE ? filteredAssignments.filter((item) => item.dueAt?.getDay() === selectedDay).map((item) => ({ id: item.id, start: item.dueAt!, title: item.title, course: item.courseName, kind: "DUE" as const })) : []),
    ...(visible.EVENT ? filteredEvents.filter((item) => item.start.getDay() === selectedDay).map((item) => ({ id: `${item.source}:${item.id}`, start: item.start, end: item.end, title: item.title, course: item.course, courseId: item.courseId, kind: "EVENT" as const, location: item.location })) : []),
  ].filter((item) => item.start >= week.start).sort((a, b) => a.start.getTime() - b.start.getTime() || a.title.localeCompare(b.title));
  if (loading) return <div className={`${panel} h-96 animate-pulse bg-white/[0.03]`} />;
  return <div className="space-y-5"><SchoolTabs /><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/55">School / Calendar</p><h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-white">Academic week</h1><p className="mt-2 text-sm text-white/45">Monday–Sunday · local time</p></div><Link href="/school" className="text-sm text-sky-100/70 hover:text-white">← Command center</Link></header><section className={`${panel} flex flex-col gap-3 p-4 sm:flex-row`}><label className="flex-1 text-xs uppercase tracking-wider text-white/40">Course<select value={courseId} onChange={(event) => setManualCourseId(event.target.value)} className="mt-1 block w-full rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 text-sm normal-case tracking-normal text-white/75"><option value="all">All courses</option>{catalog.map((identity) => <option key={identity.id} value={identity.id}>{identity.code ? `${identity.code} · ` : ""}{identity.name}</option>)}</select></label><fieldset className="flex items-end gap-2 text-xs text-white/55"><legend className="sr-only">Event types</legend>{(["CLASS", "DUE", "EVENT"] as const).map((kind) => <label key={kind} className="flex items-center gap-1.5"><input type="checkbox" checked={visible[kind]} onChange={() => setVisible((current) => ({ ...current, [kind]: !current[kind] }))} />{kind}</label>)}</fieldset></section><section className={`${panel} p-3`}><div className="grid grid-cols-7 gap-1.5">{labels.map((label, index) => { const dayNumber = new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate() + index); const dayIndex = index === 6 ? 0 : index + 1; const hasItems = filteredMeetings.some((item) => item.start.getDay() === dayIndex) || filteredAssignments.some((item) => item.dueAt?.getDay() === dayIndex) || filteredEvents.some((item) => item.start.getDay() === dayIndex); return <button type="button" key={label} onClick={() => setSelected(index)} className={`rounded-xl px-1 py-3 text-center transition ${selected === index ? "bg-sky-200/20 text-white" : "text-white/45 hover:bg-white/[0.05]"}`}><span className="block text-[10px] font-semibold uppercase">{label}</span><span className="mt-1 block text-lg">{dayNumber.getDate()}</span>{hasItems && <span className="mx-auto mt-1 block size-1.5 rounded-full bg-sky-200" />}</button>; })}</div></section><section className={`${panel} overflow-hidden`}><div className="border-b border-white/[0.08] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/60">{labels[selected]} · {shortDate(new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate() + selected))}</p><h2 className="mt-1 text-xl font-semibold text-white">Schedule details</h2></div>{dayItems.map((item) => <CalendarItemRow key={item.id} item={item} assignmentIds={week.assignments.map((assignment) => assignment.id)} catalog={catalog} />)}{!dayItems.length && <p className="p-6 text-sm text-white/45">No scheduled items for this day.</p>}</section></div>;
}

function CalendarItemRow({ item, assignmentIds, catalog }: { item: CalendarItem; assignmentIds: string[]; catalog: ReturnType<typeof buildSchoolCourseCatalog> }) {
  const destination = schoolCalendarItemHref(item, assignmentIds, catalog);
  const content = <><span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${item.kind === "CLASS" ? "bg-sky-300/10 text-sky-100" : item.kind === "DUE" ? "bg-amber-300/10 text-amber-100" : "bg-violet-300/10 text-violet-100"}`}>{item.kind === "CLASS" ? <Clock3 className="size-4" aria-hidden="true" /> : item.kind === "DUE" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <CalendarDays className="size-4" aria-hidden="true" />}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold tracking-[0.18em] text-white/35">{item.kind}</p><p className={`mt-1 truncate text-sm ${destination ? "text-white/85 group-hover:text-sky-100" : "text-white/85"}`}>{item.title}</p>{item.course && <p className="mt-1 text-xs text-white/45">{item.course}</p>}{item.location && <p className="mt-1 flex items-center gap-1 text-xs text-white/45"><MapPin className="size-3" aria-hidden="true" />{item.location}</p>}</div><span className="shrink-0 text-xs text-white/50">{item.kind === "DUE" && item.start.getHours() === 0 && item.start.getMinutes() === 0 ? `Due ${shortDate(item.start)}` : clock(item.start)}</span></>;
  const className = "flex items-start gap-3 border-b border-white/[0.07] px-5 py-4 last:border-0";
  return destination
    ? <Link href={destination} aria-label={`Open ${item.title}${item.kind === "DUE" ? " assignment" : " course"}`} className={`${className} group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200/80`}>{content}</Link>
    : <div className={className}>{content}</div>;
}

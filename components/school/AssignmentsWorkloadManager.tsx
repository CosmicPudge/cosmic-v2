"use client";

import Link from "next/link";
import { CheckCircle2, Search } from "lucide-react";
import { useState } from "react";
import type { Assignment, Course } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { buildSchoolCourseCatalog } from "@/services/school/courseIdentity";
import { localAssignmentToPlanning } from "@/services/school/semesterConsumers";
import { dedupeSchoolAssignments } from "@/services/school/assignmentIdentity";
import { assignmentWorkloadLabel, buildAssignmentWorkload, type AssignmentWorkloadSource, type AssignmentWorkloadStatus } from "@/services/school/assignmentWorkload";
import { assignmentDetailHref } from "@/services/school/assignmentDetail";
import { canonicalCourseFilterSelection } from "@/services/school/courseExperience";
import { isAssignmentActiveForPlanning, safeSchoolDate } from "@/services/school/planning";
import { useSchool } from "./context/SchoolDataContext";
import { AssignmentForm } from "./SchoolCrudViews";
import { SchoolConfirm } from "./SchoolModal";
import { readSchoolCompletionOverrides, setSchoolCompletionOverride } from "@/services/school/completionOverrides";
import SchoolTabs from "./SchoolTabs";

const panel = "rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75";
type Group = "needsAttention" | "dueSoon" | "later" | "undated" | "completed";
const groupLabels: Record<Group, string> = { needsAttention: "Needs Attention", dueSoon: "Due Soon", later: "Later", undated: "No Due Date", completed: "Completed" };
const groupOrder: Group[] = ["needsAttention", "dueSoon", "later", "undated", "completed"];

function done(item: SchoolPlanningAssignment, overrides: Set<string>) { return !isAssignmentActiveForPlanning(item) || overrides.has(item.id); }
function dueText(value: Date | string | undefined) {
  const date = safeSchoolDate(value);
  if (!date) return "No due date";
  const timed = date.getHours() !== 0 || date.getMinutes() !== 0;
  return `Due ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${timed ? ` · ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}`;
}
function sourceName(item: SchoolPlanningAssignment) {
  if (item.sourceType === "manual") return "Cosmic";
  return item.sourceType === "canvas-api" ? "Canvas" : item.sourceType === "canvas-calendar" ? "Canvas Calendar" : "School Source";
}
function toLocalPlanning(items: Assignment[], courses: Course[]) {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  return items.map((item) => localAssignmentToPlanning(item, item.courseId ? courseMap.get(item.courseId) : undefined));
}

export function AssignmentsWorkloadManager({ requestedCourseId }: { requestedCourseId?: string } = {}) {
  const { snapshot, local, loading } = useSchool();
  const [manualCourseSelection, setManualCourseSelection] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AssignmentWorkloadStatus>("active");
  const [sourceFilter, setSourceFilter] = useState<AssignmentWorkloadSource>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Assignment | null | undefined>();
  const [deleting, setDeleting] = useState<Assignment | null>(null);
  const [completionOverrides, setCompletionOverrides] = useState<Set<string>>(() => readSchoolCompletionOverrides());
  const now = new Date();
  const courses = local.data.courses;
  const catalog = buildSchoolCourseCatalog(courses, local.data.terms, snapshot?.canvasCourses ?? []);
  const courseFilter = canonicalCourseFilterSelection(requestedCourseId, catalog, local.ready && !loading, manualCourseSelection);
  const invalidCourseRequest = Boolean(requestedCourseId && local.ready && !loading && courseFilter === "all" && manualCourseSelection === null);
  const allAssignments = dedupeSchoolAssignments([...toLocalPlanning(local.data.assignments, courses), ...(snapshot?.planningAssignments ?? [])]);
  const workload = buildAssignmentWorkload({ assignments: allAssignments, catalog, courses, filters: { courseId: courseFilter === "all" ? undefined : courseFilter, status: statusFilter, source: sourceFilter, search }, now });
  const localById = new Map(local.data.assignments.map((item) => [`manual:${item.id}`, item]));
  const activeCount = allAssignments.filter((item) => !done(item, completionOverrides)).length;

  return <div className="space-y-5">
    <SchoolTabs />
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/55">School / Assignments</p><h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-white">Workload</h1><p className="mt-2 text-sm text-white/45">{activeCount} active assignments across {catalog.length} courses</p></div>
      <button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-sky-200/15 px-3.5 py-2.5 text-sm font-semibold text-sky-50 transition hover:bg-sky-200/25">+ Add Assignment</button>
    </header>

    <section className="grid gap-3 sm:grid-cols-3"><Summary label="Needs attention" value={workload.summary.needsAttention} tone="text-rose-200" /><Summary label="Due soon" value={workload.summary.dueSoon} tone="text-amber-100" /><Summary label="Later / undated" value={workload.summary.laterUndated} tone="text-sky-100" /></section>

    <section className={`${panel} grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4`}>
      <label className="text-xs uppercase tracking-wider text-white/45">Course<select value={courseFilter === "all" ? "all" : courseFilter} onChange={(event) => setManualCourseSelection(event.target.value)} className="mt-1 block w-full rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 text-sm normal-case tracking-normal text-white/80"><option value="all">All courses</option>{catalog.map((identity) => <option key={identity.id} value={identity.id}>{identity.code ? `${identity.code} · ` : ""}{identity.name}</option>)}</select></label>
      <label className="text-xs uppercase tracking-wider text-white/45">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AssignmentWorkloadStatus)} className="mt-1 block w-full rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 text-sm normal-case tracking-normal text-white/80"><option value="active">Active</option><option value="overdue">Overdue</option><option value="due-soon">Due soon</option><option value="completed">Completed</option><option value="all">All</option></select></label>
      <label className="text-xs uppercase tracking-wider text-white/45">Source<select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as AssignmentWorkloadSource)} className="mt-1 block w-full rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 text-sm normal-case tracking-normal text-white/80"><option value="all">All sources</option><option value="cosmic">Cosmic / manual</option><option value="provider">Provider</option></select></label>
      <label className="text-xs uppercase tracking-wider text-white/45">Search assignments<span className="relative mt-1 block"><Search className="absolute left-3 top-2.5 size-4 text-white/30" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or course" className="w-full rounded-xl border border-white/10 bg-[#101c35] py-2 pl-9 pr-3 text-sm normal-case tracking-normal text-white/80 placeholder:text-white/30" /></span></label>
    </section>

    {invalidCourseRequest && <p role="status" className="text-sm text-amber-100/75">That course is not in the current School catalog. Showing all assignments.</p>}

    {loading ? <div className={`${panel} p-8 text-center text-sm text-white/45`}>Loading assignments…</div> : <div className="space-y-5">
      {groupOrder.map((group) => { const items = workload.groups[group]; if (!items.length) return null; return <section key={group}>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{groupLabels[group]} <span className="text-white/25">{items.length}</span></h2>
        <div className={`${panel} overflow-hidden`}>{items.map((item) => {
          const localItem = localById.get(item.id);
          const identity = workload.resolvedCourseById.get(item.id);
          const unresolvedCourse = !identity && (item.courseId || item.courseName);
          return <article key={item.id} className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-4 py-3 last:border-0">
            <button type="button" aria-label={done(item, completionOverrides) ? `Reopen ${item.title}` : `Mark ${item.title} complete`} onClick={() => { const next = !done(item, completionOverrides); if (localItem) local.saveAssignment({ ...localItem, status: next ? "completed" : "upcoming" }); else { setSchoolCompletionOverride(item.id, next); setCompletionOverrides(readSchoolCompletionOverrides()); } }} className={`grid size-8 shrink-0 place-items-center rounded-xl ${done(item, completionOverrides) ? "bg-emerald-300/10 text-emerald-200" : "bg-white/[0.04] text-white/35"}`}><CheckCircle2 className="size-4" /></button>
            <div className="min-w-0 flex-1 basis-40"><Link href={assignmentDetailHref(item.id)} className={`block truncate text-sm hover:text-white ${done(item, completionOverrides) ? "text-white/45 line-through" : "text-white/85"}`}>{item.title}</Link><div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-white/40"><span>{identity ? <Link href={`/school/courses/${encodeURIComponent(identity.id)}`} className="hover:text-sky-100">{identity.code ? `${identity.code} · ` : ""}{identity.name}</Link> : unresolvedCourse ? item.courseName ?? "Unmatched course" : "No course linked"}</span><span>· {sourceName(item)}</span><span>· {assignmentWorkloadLabel(item, now)}</span></div></div>
            <div className="text-xs text-white/50 sm:ml-auto sm:text-right">{dueText(item.dueAt)}{item.priority !== "normal" && <span className="mt-1 block capitalize text-white/35">{item.priority} priority</span>}</div>
            {localItem && <div className="flex gap-1"><button type="button" onClick={() => setEditing(localItem)} className="rounded-lg px-2 py-1 text-xs text-white/50 transition hover:bg-white/[0.06] hover:text-white">Edit</button><button type="button" onClick={() => setDeleting(localItem)} className="rounded-lg px-2 py-1 text-xs text-rose-200/75 transition hover:bg-rose-300/10">Delete</button></div>}
          </article>;
        })}</div>
      </section>; })}
      {!workload.items.length && <div className={`${panel} p-8 text-center text-sm text-white/45`}>{emptyMessage({ allAssignments, statusFilter, courseFilter, search, sourceFilter, providerAvailable: snapshot?.sourceStatus?.canvas === "healthy" })}</div>}
    </div>}
    {editing !== undefined && <AssignmentForm assignment={editing} courses={courses} onClose={() => setEditing(undefined)} onSave={local.saveAssignment} />}
    {deleting && <SchoolConfirm title="Delete Assignment?" message="This removes the local assignment only. Provider assignments remain unchanged." onCancel={() => setDeleting(null)} onConfirm={() => { local.removeAssignment(deleting.id); setDeleting(null); }} />}
  </div>;
}

function emptyMessage(input: { allAssignments: SchoolPlanningAssignment[]; statusFilter: AssignmentWorkloadStatus; courseFilter: string; search: string; sourceFilter: AssignmentWorkloadSource; providerAvailable: boolean }) {
  if (input.sourceFilter === "provider" && !input.providerAvailable && input.allAssignments.some((item) => item.sourceType === "manual")) return "Provider assignments are unavailable right now. Your Cosmic assignments are still available.";
  if (!input.allAssignments.length) return input.providerAvailable ? "No assignments are available yet." : "No assignments yet. Add a Cosmic assignment or connect a provider.";
  if (input.search || input.courseFilter || input.sourceFilter !== "all") return "No assignments match these filters.";
  if (input.statusFilter === "overdue") return "No overdue assignments.";
  if (input.statusFilter === "due-soon") return "Nothing is due soon.";
  if (input.statusFilter === "completed") return "No completed assignments yet.";
  if (input.statusFilter === "active") return "No active assignments. Completed work is available in the Completed filter.";
  return "No assignments match this view.";
}

function Summary({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className={`${panel} p-4`}><p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p><p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p></div>; }

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSchool } from "./context/SchoolDataContext";
import { StudyDialog } from "./StudyDialog";
import { filterLocalResources, getLocalStudySetStats, getLocalStudySetsForCourse, resolveLocalCourseFilter } from "@/services/school/localStudy";
import type { LocalStudySet } from "./data/localDataHydration";

const field = "w-full rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-200/50";

export default function StudyHome({ requestedCourseId }: { requestedCourseId?: string }) {
  const { local } = useSchool();
  const router = useRouter();
  const [editing, setEditing] = useState<LocalStudySet | null | undefined>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState("");

  if (!local.ready) return <p role="status" className="py-16 text-sm text-white/50">Loading local Study data…</p>;

  const courses = local.data.courses;
  const resolvedFilter = resolveLocalCourseFilter(requestedCourseId, courses);
  const selectedCourse = resolvedFilter.course;
  const allSets = local.data.studySets ?? [];
  const sets = selectedCourse ? getLocalStudySetsForCourse(allSets, selectedCourse.id) : allSets;
  const cards = local.data.flashcards ?? [];
  const resources = filterLocalResources(local.data.resources, selectedCourse?.id);
  const now = new Date();

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setCourseId(selectedCourse?.id ?? "");
    setError("");
  }

  function openEdit(set: LocalStudySet) {
    setEditing(set);
    setTitle(set.title);
    setDescription(set.description ?? "");
    setCourseId(set.courseId ?? "");
    setError("");
  }

  function saveSet() {
    if (!title.trim()) { setError("Enter a title for this study set."); return; }
    const result = local.saveStudySet({ id: editing?.id ?? crypto.randomUUID(), title, description, ...(courseId ? { courseId } : {}) });
    if ("error" in result) { setError(typeof result.error === "string" ? result.error : "Study set could not be saved."); return; }
    setEditing(undefined);
  }

  function deleteSet(set: LocalStudySet) {
    if (!window.confirm(`Delete “${set.title}” and its flashcards? This will not delete course resources.`)) return;
    local.removeStudySet(set.id);
  }

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/55">School / Study</p><h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-white">Study workspace</h1><p className="mt-2 text-sm text-white/45">Build your own course-linked flashcards and review them on your schedule.</p></div>
      <button type="button" onClick={openCreate} className="rounded-xl bg-sky-200/15 px-3.5 py-2.5 text-sm font-semibold text-sky-50 hover:bg-sky-200/25">New Study Set</button>
    </header>

    <section className="rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-4">
      <label className="block max-w-xl text-xs uppercase tracking-wider text-white/45">Course
        <select value={selectedCourse?.id ?? ""} onChange={(event) => router.push(event.target.value ? `/school/study?course=${encodeURIComponent(event.target.value)}` : "/school/study")} className={`${field} mt-1`}>
          <option value="">All courses and general sets</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.code ? `${course.code} · ` : ""}{course.name}</option>)}
        </select>
      </label>
      {resolvedFilter.invalid && <p className="mt-2 text-sm text-amber-100/75" role="status">That course is not in your local School catalog. Showing all study sets.</p>}
    </section>

    <section className="grid gap-3 sm:grid-cols-4"><Metric label="Study sets" value={sets.length} /><Metric label="Cards" value={cards.filter((card) => !selectedCourse || allSets.some((set) => set.id === card.setId && set.courseId === selectedCourse.id)).length} /><Metric label="New cards" value={cards.filter((card) => !card.lastReviewedAt && (!selectedCourse || allSets.some((set) => set.id === card.setId && set.courseId === selectedCourse.id))).length} /><Metric label="Due for review" value={sets.reduce((sum, set) => sum + getLocalStudySetStats(set.id, cards, now).due, 0)} /></section>

    {selectedCourse && <section className="rounded-[1.35rem] border border-sky-200/10 bg-sky-200/[0.04] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-sky-200/55">Course Study</p><h2 className="mt-1 text-xl font-semibold text-white">{selectedCourse.code ? `${selectedCourse.code} · ` : ""}{selectedCourse.name}</h2></div><Link href={`/school/resources?course=${encodeURIComponent(selectedCourse.id)}`} className="text-sm text-sky-100/75 hover:text-white">Open course resources →</Link></div></section>}

    <section><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-sky-200/60">Study sets</p><h2 className="mt-1 text-xl font-semibold text-white">{selectedCourse ? `For ${selectedCourse.code ?? selectedCourse.name}` : "Your sets"}</h2></div>{selectedCourse && <button type="button" onClick={openCreate} className="text-sm text-sky-100/75">Create for this course</button>}</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sets.map((set) => {
          const stats = getLocalStudySetStats(set.id, cards, now);
          const course = courses.find((item) => item.id === set.courseId);
          return <article key={set.id} className="rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-5">
            <p className="text-xs uppercase tracking-wider text-sky-100/55">{course ? `${course.code ? `${course.code} · ` : ""}${course.name}` : set.courseId ? "Course unavailable" : "General study set"}</p>
            <h3 className="mt-2 font-semibold text-white">{set.title}</h3>
            {set.description && <p className="mt-2 line-clamp-2 text-sm text-white/45">{set.description}</p>}
            <p className="mt-4 text-xs text-white/45">{stats.total} cards · {stats.new} new · {stats.due} due</p>
            <div className="mt-4 flex flex-wrap gap-2"><Link href={`/school/study/sets/${encodeURIComponent(set.id)}`} className="rounded-lg bg-sky-200/15 px-3 py-2 text-sm text-sky-50 hover:bg-sky-200/25">Open set</Link><button type="button" onClick={() => openEdit(set)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/65">Edit</button><button type="button" onClick={() => deleteSet(set)} className="rounded-lg border border-rose-200/15 px-3 py-2 text-sm text-rose-100/75">Delete</button></div>
          </article>;
        })}
        {!sets.length && <div className="rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-5 text-sm text-white/50">{selectedCourse ? `No study sets for ${selectedCourse.code ?? selectedCourse.name} yet. Create one to start practicing.` : "No study sets yet. Create one to start practicing."}</div>}
      </div>
    </section>

    {resources.length > 0 && <section><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-sky-200/55">Resources</p><h2 className="mt-1 text-xl font-semibold text-white">{selectedCourse ? `Materials for ${selectedCourse.code ?? selectedCourse.name}` : "Saved materials"}</h2></div><Link href={selectedCourse ? `/school/resources?course=${encodeURIComponent(selectedCourse.id)}` : "/school/resources"} className="text-sm text-sky-100/70">Open Resources →</Link></div><div className="grid gap-3 md:grid-cols-2">{resources.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.09] bg-[#101c35]/75 p-4"><p className="font-medium text-white">{item.title}</p>{item.notes && <p className="mt-1 line-clamp-2 text-sm text-white/45">{item.notes}</p>}{item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-sky-100/75">Open resource ↗</a>}</article>)}</div></section>}

    {editing !== undefined && <StudyDialog title={editing ? "Edit Study Set" : "New Study Set"} onClose={() => { setEditing(undefined); setError(""); }} footer={<><button type="button" onClick={() => setEditing(undefined)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/65">Cancel</button><button type="button" onClick={saveSet} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-950">Save Study Set</button></>}><div className="grid gap-3"><label className="text-sm text-white/65">Title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className={field} /></label><label className="text-sm text-white/65">Course<select value={courseId} onChange={(event) => setCourseId(event.target.value)} className={field}><option value="">General / No Course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code ? `${course.code} · ` : ""}{course.name}</option>)}</select></label><label className="text-sm text-white/65">Description (optional)<textarea value={description} onChange={(event) => setDescription(event.target.value)} className={field} rows={3} /></label></div>{error && <p className="mt-3 text-sm text-rose-200" role="alert">{error}</p>}</StudyDialog>}
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-4"><p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p></div>; }

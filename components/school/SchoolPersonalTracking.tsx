"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/core/contracts/School";

type StudyEntry = { id: string; date: string; minutes: number; courseId: string; note: string };
type FeedbackEntry = { id: string; date: string; courseId: string; title: string; detail: string };
const inputStyle = "w-full min-w-0 rounded-lg border border-violet-300/20 bg-[#160e30]/80 px-3 py-2 text-sm text-white placeholder:text-white/35";

export default function SchoolPersonalTracking({ scopeId, termId, courses }: { scopeId: string; termId?: string; courses: Course[] }) {
  const key = "cosmos.school.m2.tracking." + scopeId + "." + (termId ?? "none");
  const [study, setStudy] = useState<StudyEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [studyMinutes, setStudyMinutes] = useState("60");
  const [studyCourse, setStudyCourse] = useState("");
  const [studyNote, setStudyNote] = useState("");
  const [feedbackCourse, setFeedbackCourse] = useState("");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackDetail, setFeedbackDetail] = useState("");
  const [readyKey, setReadyKey] = useState("");
  useEffect(() => {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || "{}") as { study?: StudyEntry[]; feedback?: FeedbackEntry[] };
      setStudy(Array.isArray(value.study) ? value.study : []);
      setFeedback(Array.isArray(value.feedback) ? value.feedback : []);
    } catch { setStudy([]); setFeedback([]); }
    setReadyKey(key);
  }, [key]);
  useEffect(() => {
    if (readyKey !== key) return;
    try { window.localStorage.setItem(key, JSON.stringify({ study, feedback })); } catch {}
  }, [key, readyKey, study, feedback]);
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 6);
  const lastSevenDays = study.filter((entry) => new Date(entry.date + "T12:00:00") >= start);
  const totalMinutes = lastSevenDays.reduce((sum, item) => sum + item.minutes, 0);
  const courseName = (id: string) => courses.find((course) => course.id === id)?.code || courses.find((course) => course.id === id)?.name || "General";
  function recordStudy() {
    const minutes = Number(studyMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) return;
    const date = new Date();
    const stamp = [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
    setStudy((entries) => [{ id: crypto.randomUUID(), date: stamp, minutes, courseId: studyCourse, note: studyNote.trim() }, ...entries]);
    setStudyNote("");
  }
  function recordFeedback() {
    if (!feedbackTitle.trim()) return;
    setFeedback((entries) => [{ id: crypto.randomUUID(), date: new Date().toISOString(), courseId: feedbackCourse, title: feedbackTitle.trim(), detail: feedbackDetail.trim() }, ...entries]);
    setFeedbackTitle(""); setFeedbackDetail("");
  }
  return <div className="mt-4 grid gap-4 xl:grid-cols-2">
    <section className="rounded-2xl border border-violet-300/25 bg-violet-950/15 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/60">Study tracking</p><h2 className="mt-1 text-xl font-semibold text-white">Study hours</h2></div>
        <div className="text-right"><p className="text-2xl font-semibold text-white">{(totalMinutes / 60).toFixed(1)}h</p><p className="text-xs text-white/45">Past 7 days · recorded time</p></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_100px_auto]">
        <select aria-label="Study course" className={inputStyle} value={studyCourse} onChange={(e) => setStudyCourse(e.target.value)}><option value="">General studying</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code || course.name}</option>)}</select>
        <input aria-label="Minutes studied" className={inputStyle} type="number" min={1} max={1440} value={studyMinutes} onChange={(e) => setStudyMinutes(e.target.value)} />
        <button type="button" className="rounded-lg border border-violet-300/30 px-4 py-2 text-sm text-white hover:bg-violet-400/10" onClick={recordStudy}>Log time</button>
      </div>
      <input aria-label="Study note" placeholder="Optional study note" className={inputStyle + " mt-2"} value={studyNote} onChange={(e) => setStudyNote(e.target.value)} />
      <div className="mt-3 space-y-2">
        {study.slice(0, 4).map((entry) => <div key={entry.id} className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs text-white/65"><span>{entry.date} · {courseName(entry.courseId)} · {entry.minutes} min</span><button type="button" className="text-red-200/70 hover:text-red-100" onClick={() => setStudy((items) => items.filter((item) => item.id !== entry.id))}>Remove</button></div>)}
        {!study.length ? <p className="text-sm text-white/45">Log a study session to start tracking actual hours.</p> : null}
      </div>
    </section>
    <section className="rounded-2xl border border-violet-300/25 bg-violet-950/15 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/60">Manual updates</p>
      <h2 className="mt-1 text-xl font-semibold text-white">Feedback & announcements</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <select aria-label="Feedback course" className={inputStyle} value={feedbackCourse} onChange={(e) => setFeedbackCourse(e.target.value)}><option value="">General update</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code || course.name}</option>)}</select>
        <input aria-label="Update title" placeholder="Grade returned, announcement..." className={inputStyle} value={feedbackTitle} onChange={(e) => setFeedbackTitle(e.target.value)} maxLength={160} />
      </div>
      <textarea aria-label="Update details" className={inputStyle + " mt-2"} rows={2} placeholder="Notes and feedback (optional)" value={feedbackDetail} onChange={(e) => setFeedbackDetail(e.target.value)} maxLength={2000} />
      <button type="button" className="mt-2 rounded-lg border border-violet-300/30 px-4 py-2 text-sm text-white hover:bg-violet-400/10" onClick={recordFeedback} disabled={!feedbackTitle.trim()}>Add update</button>
      <div className="mt-3 space-y-2">
        {feedback.slice(0, 4).map((entry) => <div key={entry.id} className="border-t border-white/10 pt-2 text-sm text-white/75"><div className="flex items-center justify-between gap-2"><span>{courseName(entry.courseId)} · {entry.title}</span><button type="button" className="shrink-0 text-xs text-red-200/70 hover:text-red-100" onClick={() => setFeedback((items) => items.filter((item) => item.id !== entry.id))}>Remove</button></div>{entry.detail ? <p className="mt-1 whitespace-pre-wrap text-xs text-white/50">{entry.detail}</p> : null}</div>)}
        {!feedback.length ? <p className="text-sm text-white/45">Add instructor feedback or class announcements manually.</p> : null}
      </div>
    </section>
  </div>;
}

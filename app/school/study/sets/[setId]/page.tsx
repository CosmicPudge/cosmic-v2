"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSchool } from "@/components/school/context/SchoolDataContext";
import { StudyDialog } from "@/components/school/StudyDialog";
import type { LocalStudyCard } from "@/components/school/data/localDataHydration";
import { parseBulkCards } from "@/services/school/studyBulk";
import { getLocalStudyQueue, getLocalStudySetStats, studyCourseHref } from "@/services/school/localStudy";
import type { ReviewRating } from "@/services/school/studyReview";

type Mode = "add" | "bulk" | "edit-set" | "edit-card" | "study" | null;
const field = "w-full rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-200/50";

export default function StudySetPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = use(params);
  const router = useRouter();
  const { local } = useSchool();
  const [mode, setMode] = useState<Mode>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [bulk, setBulk] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [editingCard, setEditingCard] = useState<LocalStudyCard | null>(null);
  const [sessionQueue, setSessionQueue] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const reviewGuard = useRef(false);

  const set = (local.data.studySets ?? []).find((item) => item.id === setId);
  const cards = (local.data.flashcards ?? []).filter((card) => card.setId === setId);
  const course = set?.courseId ? local.data.courses.find((item) => item.id === set.courseId) : undefined;
  const queue = getLocalStudyQueue(cards);
  const currentCard = cards.find((card) => card.id === sessionQueue[current]);
  const parsedBulk = parseBulkCards(bulk);

  function openSetEditor() {
    if (!set) return;
    setTitle(set.title);
    setDescription(set.description ?? "");
    setCourseId(set.courseId ?? "");
    setError("");
    setMode("edit-set");
  }

  function openAddCard() {
    setEditingCard(null);
    setFront("");
    setBack("");
    setError("");
    setMode("add");
  }

  function openEditCard(card: LocalStudyCard) {
    setEditingCard(card);
    setFront(card.front);
    setBack(card.back);
    setError("");
    setMode("edit-card");
  }

  function saveSet() {
    if (!set || !title.trim()) { setError("Enter a title for this study set."); return; }
    const result = local.saveStudySet({ id: set.id, title, description, ...(courseId ? { courseId } : {}) });
    if ("error" in result) { setError(typeof result.error === "string" ? result.error : "Study set could not be saved."); return; }
    setMode(null);
  }

  function saveCard() {
    if (!front.trim()) { setError("Enter a front for this card."); return; }
    if (!back.trim()) { setError("Enter a back for this card."); return; }
    const result = local.saveStudyCards([{ id: editingCard?.id ?? crypto.randomUUID(), setId, front, back, ...(editingCard?.notes ? { notes: editingCard.notes } : {}) }]);
    if ("error" in result) { setError(typeof result.error === "string" ? result.error : "Flashcard could not be saved."); return; }
    setMode(null);
    setEditingCard(null);
  }

  function saveBulk() {
    if (!parsedBulk.cards.length) { setError("Add at least one valid Question[TAB]Answer or Question | Answer row."); return; }
    const result = local.saveStudyCards(parsedBulk.cards.map((card) => ({ id: crypto.randomUUID(), setId, ...card })));
    if ("error" in result) { setError(typeof result.error === "string" ? result.error : "Flashcards could not be imported."); return; }
    setError(parsedBulk.invalidRows.length ? `Imported ${parsedBulk.cards.length} valid cards; skipped ${parsedBulk.invalidRows.length} malformed row${parsedBulk.invalidRows.length === 1 ? "" : "s"}.` : "");
    setBulk("");
    setMode(null);
  }

  function deleteCard(card: LocalStudyCard) {
    if (window.confirm(`Delete this flashcard?`)) local.removeStudyCard(card.id);
  }

  function deleteSet() {
    if (!set || !window.confirm(`Delete “${set.title}” and its flashcards? Course resources will remain.`)) return;
    local.removeStudySet(set.id);
    router.push(course ? studyCourseHref(course.id) : "/school/study");
  }

  function startReview() {
    setSessionQueue(queue.map((card) => card.id));
    setCurrent(0);
    setRevealed(false);
    setError("");
    setMode("study");
  }

  const review = useCallback((rating: ReviewRating) => {
    const cardId = sessionQueue[current];
    if (!cardId || reviewGuard.current) return;
    reviewGuard.current = true;
    setSaving(true);
    const result = local.reviewStudyCard(cardId, rating);
    if ("error" in result) setError(typeof result.error === "string" ? result.error : "Review could not be saved.");
    else {
      setRevealed(false);
      setCurrent((value) => value + 1);
    }
    setSaving(false);
    queueMicrotask(() => { reviewGuard.current = false; });
  }, [current, local, sessionQueue]);

  useEffect(() => {
    if (mode !== "study") return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) || target.isContentEditable) return;
      if (event.code === "Space" && currentCard && !revealed) { event.preventDefault(); setRevealed(true); }
      if (revealed && ["1", "2", "3", "4"].includes(event.key)) void review(((["again", "hard", "good", "easy"] as ReviewRating[])[Number(event.key) - 1]));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, currentCard, current, revealed, sessionQueue, saving, review]);

  if (!local.ready) return <p role="status" className="py-16 text-sm text-white/50">Loading local Study data…</p>;
  if (!set) return <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60"><p>Study set not found in local School data.</p><Link href="/school/study" className="mt-4 inline-block text-sky-100/80">← Back to Study</Link></div>;

  const dialogTitle = mode === "edit-set" ? "Edit Study Set" : mode === "edit-card" ? "Edit Flashcard" : mode === "bulk" ? "Bulk Add Flashcards" : "Add Flashcard";
  return <div className="mx-auto max-w-4xl space-y-5">
    <Link href={course ? studyCourseHref(course.id) : "/school/study"} className="text-sm text-white/45 hover:text-white">← {course ? `${course.code ?? course.name} Study` : "Study"}</Link>
    <header className="rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs uppercase tracking-wider text-sky-200/55">{course ? <Link href={`/school/courses/${encodeURIComponent(course.id)}`} className="hover:text-white">{course.code ? `${course.code} · ` : ""}{course.name}</Link> : set.courseId ? "Course unavailable" : "General study set"}</p><h1 className="mt-2 text-3xl font-black text-white">{set.title}</h1>{set.description && <p className="mt-2 text-sm text-white/55">{set.description}</p>}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={startReview} disabled={!queue.length} className="rounded-xl bg-sky-200/15 px-3 py-2 text-sm font-semibold text-sky-50 disabled:opacity-40">Review {queue.length ? `(${queue.length})` : ""}</button><button type="button" onClick={openAddCard} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Add Card</button><button type="button" onClick={() => { setBulk(""); setError(""); setMode("bulk"); }} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Bulk Add</button><button type="button" onClick={openSetEditor} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Edit Set</button><button type="button" onClick={deleteSet} className="rounded-xl border border-rose-200/20 px-3 py-2 text-sm text-rose-100/75">Delete Set</button></div></div>
      <div className="mt-5 grid grid-cols-3 gap-3"><Stat label="Cards" value={cards.length} /><Stat label="New" value={cards.filter((card) => !card.lastReviewedAt).length} /><Stat label="Due" value={getLocalStudySetStats(set.id, cards).due} /></div>
    </header>

    {error && <p className="text-sm text-amber-100/80" role="status">{error}</p>}
    {mode === "study" && <section className="rounded-[1.35rem] border border-sky-200/15 bg-sky-200/[0.06] p-4 sm:p-6">{currentCard ? <><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/45"><span>Card {current + 1} of {sessionQueue.length}</span><span>Space to reveal · 1–4 to rate</span></div><div className="mt-6 min-h-56 rounded-2xl border border-white/10 bg-black/15 p-4 sm:mt-8 sm:p-6"><p className="text-[10px] uppercase tracking-[0.2em] text-sky-200/60">Front</p><p className="mt-4 whitespace-pre-wrap break-words text-xl leading-8 text-white">{currentCard.front}</p>{revealed && <><p className="mt-8 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.2em] text-emerald-200/60">Back</p><p className="mt-4 whitespace-pre-wrap break-words text-lg leading-8 text-white/80">{currentCard.back}</p></>}</div>{!revealed ? <button type="button" onClick={() => setRevealed(true)} className="mt-5 w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950">Reveal Answer</button> : <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{(["again", "hard", "good", "easy"] as ReviewRating[]).map((rating, index) => <button type="button" key={rating} disabled={saving} onClick={() => review(rating)} className="rounded-xl border border-white/10 px-2 py-3 text-sm capitalize text-white/75 hover:bg-white/[0.06]">{index + 1} · {rating}</button>)}</div>}</> : <div><h2 className="text-xl font-semibold text-white">Session complete</h2><p className="mt-2 text-sm text-white/55">You reviewed {sessionQueue.length} card{sessionQueue.length === 1 ? "" : "s"}. Your progress is saved locally.</p><button type="button" onClick={() => setMode(null)} className="mt-5 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70">Back to cards</button></div>}</section>}

    {mode !== "study" && <section className="rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-sky-200/55">Flashcards</p><h2 className="mt-1 text-xl font-semibold text-white">Your cards</h2></div>{!cards.length && <p className="text-sm text-white/45">No cards yet. Add one or import a tab-separated list.</p>}</div>{cards.map((card) => <article key={card.id} className="mt-3 rounded-xl border border-white/[0.07] p-4"><p className="whitespace-pre-wrap break-words text-sm text-white/85">{card.front}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/55">{card.back}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-white/35">{card.reviewCount} reviews{card.lastReviewedAt ? ` · next ${card.nextReviewAt?.toLocaleString() ?? "not scheduled"}` : " · new"}</p><div className="flex gap-2"><button type="button" onClick={() => openEditCard(card)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/65">Edit</button><button type="button" onClick={() => deleteCard(card)} className="rounded-lg border border-rose-200/15 px-3 py-1.5 text-xs text-rose-100/75">Delete</button></div></div></article>)}</section>}

    {mode && mode !== "study" && <StudyDialog title={dialogTitle} onClose={() => { setMode(null); setError(""); }} footer={<><button type="button" onClick={() => { setMode(null); setError(""); }} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/65">Cancel</button><button type="button" disabled={mode === "bulk" && parsedBulk.cards.length === 0} onClick={() => mode === "edit-set" ? saveSet() : mode === "bulk" ? saveBulk() : saveCard()} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">{mode === "bulk" ? "Import Valid Cards" : mode === "edit-set" ? "Save Set" : mode === "edit-card" ? "Save Card" : "Add Card"}</button></>}>
      {mode === "edit-set" ? <div className="grid gap-3"><label className="text-sm text-white/65">Title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className={field} /></label><label className="text-sm text-white/65">Course<select value={courseId} onChange={(event) => setCourseId(event.target.value)} className={field}><option value="">General / No Course</option>{local.data.courses.map((item) => <option key={item.id} value={item.id}>{item.code ? `${item.code} · ` : ""}{item.name}</option>)}</select></label><label className="text-sm text-white/65">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} className={field} rows={3} /></label></div> : mode === "bulk" ? <div className="grid gap-3"><p className="text-xs leading-5 text-white/50">One card per line: Question[TAB]Answer or Question | Answer. Valid: {parsedBulk.cards.length}; malformed: {parsedBulk.invalidRows.length}.</p>{parsedBulk.invalidRows.length > 0 && <ul className="max-h-24 overflow-y-auto text-xs text-amber-100/75">{parsedBulk.invalidRows.map((row) => <li key={`${row.line}-${row.value}`}>Line {row.line}: {row.value}</li>)}</ul>}<label className="text-sm text-white/65">Cards<textarea autoFocus value={bulk} onChange={(event) => setBulk(event.target.value)} placeholder={'Question\tAnswer\nAnother question | Answer'} className={field} rows={5} /></label></div> : <div className="grid gap-3"><label className="text-sm text-white/65">Front<textarea autoFocus value={front} onChange={(event) => setFront(event.target.value)} className={field} rows={3} /></label><label className="text-sm text-white/65">Back<textarea value={back} onChange={(event) => setBack(event.target.value)} className={field} rows={3} /></label></div>}{error && <p className="mt-3 text-sm text-rose-200" role="alert">{error}</p>}
    </StudyDialog>}
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"><p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p><p className="mt-1 text-xl font-bold text-white">{value}</p></div>; }

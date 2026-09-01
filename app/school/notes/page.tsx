"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSchool } from "@/components/school/context/SchoolDataContext";

type Note = { id: string; title: string; content: string; courseId?: string | null; topics?: unknown; classDate?: string | null; updatedAt: string };
const panel = "rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-5";

export default function NotesPage() {
  const { local } = useSchool(); const [notes, setNotes] = useState<Note[]>([]); const [error, setError] = useState("");
  useEffect(() => { void fetch("/api/school/notes", { cache: "no-store" }).then(async (res) => { const body = await res.json() as { notes?: Note[]; error?: string }; if (!res.ok) throw new Error(body.error); setNotes(body.notes ?? []); }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Notes are unavailable.")); }, []);
  const course = (id?: string | null) => local.data.courses.find((item) => item.id === id);
  return <div className="space-y-6"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/55">School / Knowledge</p><h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-white">Notes</h1><p className="mt-2 text-sm text-white/45">Your bounded study memory, with source provenance kept intact.</p></div><Link href="/school/notes/new" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950">Add note</Link></header>{error && <p className="text-sm text-red-200">{error}</p>}<section className="grid gap-3">{notes.map((note) => <Link key={note.id} href={`/school/notes/${encodeURIComponent(note.id)}`} className={`${panel} transition hover:bg-white/[0.06]`}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-white">{note.title}</h2><p className="mt-1 text-xs text-sky-100/45">{course(note.courseId)?.name ?? "General study note"}{note.classDate ? ` · ${new Date(note.classDate).toLocaleDateString()}` : ""}</p></div><span className="text-xs text-white/35">{new Date(note.updatedAt).toLocaleDateString()}</span></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">{note.content}</p><div className="mt-3 flex flex-wrap gap-2">{(Array.isArray(note.topics) ? note.topics : []).filter((item): item is string => typeof item === "string").slice(0, 6).map((topic) => <span key={topic} className="rounded-full bg-sky-200/[0.08] px-2 py-1 text-[11px] text-sky-100/65">{topic}</span>)}</div></Link>)}{!notes.length && !error && <div className={panel}><p className="text-sm text-white/50">No notes yet. Add a class note and tag the topics you want to revisit.</p></div>}</section></div>;
}

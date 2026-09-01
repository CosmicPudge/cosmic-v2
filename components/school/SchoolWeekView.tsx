"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, Shirt, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useSchool } from "./context/SchoolDataContext";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Weekend"];
const panel = "rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 shadow-[0_18px_60px_rgba(0,0,0,.16)]";

export default function SchoolWeekView() {
  const { snapshot, loading } = useSchool();
  const week = useMemo(() => {
    const now = new Date(); const monday = new Date(now); const offset = (now.getDay() + 6) % 7;
    monday.setHours(0, 0, 0, 0); monday.setDate(now.getDate() - offset);
    return days.map((label, index) => {
      const date = new Date(monday); date.setDate(monday.getDate() + (index < 5 ? index : 5));
      const entries = (snapshot?.timelineEntries ?? []).filter((entry) => entry.start.toDateString() === date.toDateString());
      const planEntries = (snapshot?.coursePlans ?? []).flatMap((plan) => [
        ...plan.exams.filter((item) => item.date && new Date(item.date).toDateString() === date.toDateString()).map((item) => ({ id: `plan-exam-${item.sourceId}-${item.title}`, title: item.title, start: new Date(item.date!), end: new Date(item.date!), kind: "deadline" as const, sourceType: "approved-course-plan", sourceId: item.sourceId, status: "upcoming" })),
        ...plan.majorAssignments.filter((item) => item.dueAt && new Date(item.dueAt).toDateString() === date.toDateString()).map((item) => ({ id: `plan-assignment-${item.sourceId}-${item.title}`, title: item.title, start: new Date(item.dueAt!), end: new Date(item.dueAt!), kind: "deadline" as const, sourceType: "approved-course-plan", sourceId: item.sourceId, status: "upcoming" })),
      ]);
      const eventRequirements = (snapshot?.sourceIntelligence?.events ?? []).filter((event) => event.startsAt && new Date(event.startsAt).toDateString() === date.toDateString() && (event.attire?.value || event.requiredItems?.length));
      const knowledge = (snapshot?.requirements ?? []).filter((item) => item.relevantDate && item.relevantDate.toDateString() === date.toDateString());
      const requirements = [...eventRequirements, ...knowledge.map((item) => ({ id: item.id, attire: item.category === "wear" ? { value: item.value, certainty: "explicit" as const } : undefined, requiredItems: item.category === "wear" ? [] : [item.value] }))];
      return { label, date, entries: [...entries, ...planEntries], requirements };
    });
  }, [snapshot]);
  if (loading) return <p className="py-16 text-sm text-white/50">Loading your week…</p>;
  const allEntries = week.flatMap((day) => day.entries); const deadlines = allEntries.filter((entry) => entry.kind === "deadline");
  const requirements = [...week.flatMap((day) => day.requirements), ...(snapshot?.requirements ?? []).map((item) => ({ id: item.id, attire: { value: item.value }, requiredItems: [] as string[] }))];
  const suggestedReview = [...new Set((snapshot?.topics ?? []).map((topic) => topic.value))].slice(0, 5);
  return <div className="space-y-6"><header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/55">School / Week</p><h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-white">This week</h1><p className="mt-2 text-sm text-white/45">Normalized academic schedule, deadlines, and approved requirements.</p></div><Link href="/school" className="text-sm text-sky-100/75">← Command center</Link></header><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Deadlines" value={deadlines.length} /><Stat label="Events" value={allEntries.filter((entry) => entry.kind !== "deadline").length} /><Stat label="Bring / wear" value={requirements.length} /><Stat label="Overdue" value={deadlines.filter((entry) => entry.status === "overdue").length} /></section><section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{week.map((day) => <article key={day.label} className={`${panel} min-h-48 overflow-hidden`}><div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3"><div><p className="text-sm font-semibold text-white">{day.label}</p><p className="mt-0.5 text-xs text-white/35">{day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div><CalendarDays className="size-4 text-sky-100/45" /></div><div className="space-y-2 p-4">{day.entries.slice(0, 6).map((entry) => <div key={entry.id} className="flex gap-2"><span className={`mt-1 size-2 shrink-0 rounded-full ${entry.kind === "deadline" ? "bg-amber-200" : entry.kind === "afrotc" ? "bg-orange-200" : "bg-sky-200"}`} /><div className="min-w-0"><p className="truncate text-sm text-white/75">{entry.title}</p><p className="text-xs text-white/35">{entry.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p></div></div>)}{day.requirements.map((event) => <div key={`req-${event.id}`} className="rounded-lg bg-orange-200/[0.06] px-2.5 py-2 text-xs text-orange-100/75"><span className="mr-1.5 uppercase tracking-wider text-orange-100/45">{event.attire?.value ? "Wear" : "Bring"}</span>{event.attire?.value ?? event.requiredItems?.join(", ")}</div>)}{!day.entries.length && !day.requirements.length && <p className="py-3 text-xs text-white/30">Nothing normalized for this day.</p>}</div></article>)}</section><section className={`${panel} p-5`}><div className="flex items-center gap-2"><ShoppingBag className="size-4 text-orange-200/70" /><h2 className="font-semibold text-white">Weekly prep</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Prep icon={<CheckCircle2 />} label="Due" items={deadlines.map((item) => item.title)} /><Prep icon={<Shirt />} label="Wear / bring" items={requirements.flatMap((event) => [event.attire?.value, ...(event.requiredItems ?? [])].filter(Boolean) as string[])} /><Prep icon={<Sparkles />} label="Suggested review" items={suggestedReview} /></div><p className="mt-4 flex items-center gap-2 text-xs text-white/30"><Clock3 className="size-3.5" /> Suggested review is optional; deadlines remain the priority.</p></section></div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className={`${panel} p-4`}><p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p></div>; }
function Prep({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) { return <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"><span className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/40">{icon}{label}</span>{items.length ? <ul className="mt-3 space-y-1 text-sm text-white/65">{items.slice(0, 5).map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}</ul> : <p className="mt-3 text-xs text-white/30">None supported</p>}</div>; }

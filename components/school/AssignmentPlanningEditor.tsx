"use client";

import { useState } from "react";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { formatEstimatedMinutes, MAX_ESTIMATED_MINUTES } from "@/services/school/planningFormat";

const states: SchoolPlanningAssignment["planningStatus"][] = ["not_started", "planned", "in_progress", "done"];
const priorities: SchoolPlanningAssignment["priority"][] = ["low", "normal", "high", "critical"];
const estimates = [15, 30, 45, 60, 90, 120, 180];

export function AssignmentPlanningEditor({ assignment }: { assignment: SchoolPlanningAssignment }) {
  const [item, setItem] = useState(assignment);
  const [custom, setCustom] = useState(assignment.estimatedMinutes?.toString() ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  async function save(field: string, value: Record<string, unknown>) {
    setSaving(field); setError("");
    try {
      const response = await fetch(`/api/school/assignments/${encodeURIComponent(item.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
      const body = await response.json() as { assignment?: SchoolPlanningAssignment; error?: string };
      if (!response.ok || !body.assignment) throw new Error(body.error ?? "Could not save planning changes.");
      const next = { ...body.assignment, dueAt: body.assignment.dueAt ? new Date(body.assignment.dueAt) : undefined, createdAt: new Date(body.assignment.createdAt), updatedAt: new Date(body.assignment.updatedAt) };
      setItem(next); window.dispatchEvent(new Event("cosmic:school-refresh"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save planning changes."); }
    finally { setSaving(null); }
  }

  return <section className="rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">Cosmic planning</p><p className="mt-1 text-xs text-white/35">Your planning metadata is independent from Canvas.</p></div>{saving && <span className="text-xs text-white/40">Saving…</span>}</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm text-white/65">Planning state<select value={item.planningStatus} disabled={!!saving} onChange={(event) => void save("state", { planningStatus: event.target.value })} className="mt-1 block w-full rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 capitalize text-white/75 focus:outline-none focus:ring-2 focus:ring-sky-200/50">{states.map((state) => <option key={state} value={state}>{state.replaceAll("_", " ")}</option>)}</select></label><label className="text-sm text-white/65">Priority<select value={item.priority} disabled={!!saving} onChange={(event) => void save("priority", { priority: event.target.value })} className="mt-1 block w-full rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 capitalize text-white/75 focus:outline-none focus:ring-2 focus:ring-sky-200/50">{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label><label className="text-sm text-white/65 sm:col-span-2">Estimated time<select value={custom === "custom" ? "custom" : item.estimatedMinutes?.toString() ?? ""} disabled={!!saving} onChange={(event) => { const value = event.target.value; setCustom(value); if (value !== "custom") void save("estimate", { estimatedMinutes: value ? Number(value) : null }); }} className="mt-1 block w-full rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 text-white/75 focus:outline-none focus:ring-2 focus:ring-sky-200/50"><option value="">Not Specified</option>{estimates.map((value) => <option key={value} value={value}>{formatEstimatedMinutes(value)}</option>)}<option value="custom">Custom</option></select>{custom === "custom" && <input type="number" min="1" max={MAX_ESTIMATED_MINUTES} step="1" value={item.estimatedMinutes ?? ""} disabled={!!saving} onChange={(event) => setItem((current) => ({ ...current, estimatedMinutes: event.target.value ? Number(event.target.value) : undefined }))} onBlur={() => { const value = item.estimatedMinutes; if (value !== undefined && Number.isSafeInteger(value) && value > 0 && value <= MAX_ESTIMATED_MINUTES) void save("estimate", { estimatedMinutes: value }); }} className="mt-2 block w-full rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 text-sm text-white/75" placeholder="Minutes" />}</label><label className="text-sm text-white/65 sm:col-span-2">Planning notes<textarea value={item.personalNotes ?? ""} disabled={!!saving} onChange={(event) => setItem((current) => ({ ...current, personalNotes: event.target.value }))} onBlur={() => void save("notes", { personalNotes: item.personalNotes ?? "" })} rows={4} className="mt-1 block w-full rounded-xl border border-white/10 bg-[#101c35] px-3 py-2 text-white/75 focus:outline-none focus:ring-2 focus:ring-sky-200/50" placeholder="Add private planning notes…" /></label></div>{error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}</section>;
}

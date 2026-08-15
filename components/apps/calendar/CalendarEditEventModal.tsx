"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/core/contracts";

interface Props { event: CalendarEvent; onClose: () => void; onSaved: () => void; }

function dateValue(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
function timeValue(value: Date) { return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`; }
function localDate(date: string, time: string): Date | null { const [year, month, day] = date.split("-").map(Number); const [hours, minutes] = time.split(":").map(Number); return [year, month, day, hours, minutes].every(Number.isInteger) ? new Date(year, month - 1, day, hours, minutes) : null; }

export default function CalendarEditEventModal({ event, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(dateValue(event.start));
  const [startTime, setStartTime] = useState(timeValue(event.start));
  const [endTime, setEndTime] = useState(timeValue(event.end));
  const [location, setLocation] = useState(event.location ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const start = localDate(date, startTime); const end = localDate(date, endTime);
    if (!event.writeId || !title.trim() || !start || !end || end <= start) { setError("Enter a title and an end time after the start time."); return; }
    setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/calendar/events/${event.writeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), start: start.toISOString(), end: end.toISOString(), ...(location.trim() ? { location: location.trim() } : {}), ...(description.trim() ? { description: description.trim() } : {}) }) });
      const data: { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update the event.");
      onSaved(); onClose();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to update the event."); } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md" onMouseDown={onClose}><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#111114]/90 p-6 shadow-2xl backdrop-blur-xl" onMouseDown={(item) => item.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit calendar event"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">{event.calendarName}</p><h2 className="mt-2 text-2xl font-bold text-white">Edit Event</h2></div><button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white">Close</button></div><div className="mt-6 space-y-4"><label className="block text-xs font-medium text-white/55">Title<input value={title} onChange={(item) => setTitle(item.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/25" /></label><label className="block text-xs font-medium text-white/55">Calendar<span className="mt-2 block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/60">{event.calendarName}</span></label><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><label className="block text-xs font-medium text-white/55 sm:col-span-3">Date<input type="date" value={date} onChange={(item) => setDate(item.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]" /></label><label className="block text-xs font-medium text-white/55">Start Time<input type="time" value={startTime} onChange={(item) => setStartTime(item.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]" /></label><label className="block text-xs font-medium text-white/55">End Time<input type="time" value={endTime} onChange={(item) => setEndTime(item.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]" /></label></div><label className="block text-xs font-medium text-white/55">Location<input value={location} onChange={(item) => setLocation(item.target.value)} maxLength={300} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /></label><label className="block text-xs font-medium text-white/55">Description<textarea value={description} onChange={(item) => setDescription(item.target.value)} maxLength={4000} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" /></label>{error && <p className="rounded-xl border border-red-300/15 bg-red-300/5 px-3 py-2 text-sm text-red-100">{error}</p>}<button type="button" onClick={() => void save()} disabled={saving} className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-40">{saving ? "Saving…" : "Save Changes"}</button></div></div></div>;
}

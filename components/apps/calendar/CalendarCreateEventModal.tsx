"use client";

import { useEffect, useState } from "react";

import type { WritableCalendar } from "@/core/contracts";

interface Props {
  selectedDate: Date;
  onClose: () => void;
  onCreated: () => void;
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toLocalDate(date: string, time: string): Date | null {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes);
}

export default function CalendarCreateEventModal({
  selectedDate,
  onClose,
  onCreated,
}: Props) {
  const [calendars, setCalendars] = useState<WritableCalendar[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(true);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => formatDateInput(selectedDate));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [calendarId, setCalendarId] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCalendars() {
      try {
        const response = await fetch("/api/calendar/writable-calendars", {
          cache: "no-store",
        });
        const data: { calendars?: WritableCalendar[] } = await response.json();

        if (!response.ok) {
          throw new Error("Unable to load writable calendars.");
        }

        if (!cancelled) {
          const writable = data.calendars ?? [];
          setCalendars(writable);
          setCalendarId(writable[0]?.id ?? "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load writable calendars.");
        }
      } finally {
        if (!cancelled) {
          setLoadingCalendars(false);
        }
      }
    }

    void loadCalendars();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(confirmDuplicate = false) {
    const start = toLocalDate(date, startTime);
    const end = toLocalDate(date, endTime);

    if (!title.trim() || !start || !end || end <= start || !calendarId) {
      setError("Enter a title, writable calendar, and an end time after the start time.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          calendarId,
          start: start.toISOString(),
          end: end.toISOString(),
          ...(location.trim() ? { location: location.trim() } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          confirmDuplicate,
        }),
      });
      const data: { error?: string; duplicate?: boolean } = await response.json();

      if (response.status === 409 && data.duplicate) {
        setDuplicateWarning(true);
        setError(data.error ?? "A matching event already exists.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create the event.");
      }

      onCreated();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create the event.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#111114]/90 p-6 shadow-2xl backdrop-blur-xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Create calendar event">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">Calendar</p>
            <h2 className="mt-2 text-2xl font-bold text-white">New Event</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white">Close</button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-xs font-medium text-white/55">Title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} autoFocus className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/25" /></label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block text-xs font-medium text-white/55 sm:col-span-3">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark] outline-none focus:border-white/25" /></label>
            <label className="block text-xs font-medium text-white/55">Start Time<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark] outline-none focus:border-white/25" /></label>
            <label className="block text-xs font-medium text-white/55">End Time<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark] outline-none focus:border-white/25" /></label>
          </div>
          <label className="block text-xs font-medium text-white/55">Calendar<select value={calendarId} onChange={(event) => setCalendarId(event.target.value)} disabled={loadingCalendars || calendars.length === 0} className="mt-2 w-full rounded-xl border border-white/10 bg-[#17171b] px-3 py-2 text-sm text-white outline-none focus:border-white/25"><option value="">{loadingCalendars ? "Loading writable calendars…" : "No writable Apple calendar configured"}</option>{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.displayName}</option>)}</select></label>
          <label className="block text-xs font-medium text-white/55">Location <span className="text-white/30">optional</span><input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={300} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/25" /></label>
          <label className="block text-xs font-medium text-white/55">Description <span className="text-white/30">optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={4000} rows={3} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/25" /></label>
          {error && <p className="rounded-xl border border-red-300/15 bg-red-300/5 px-3 py-2 text-sm text-red-100">{error}</p>}
          {duplicateWarning && <p className="text-xs text-amber-100/80">Create it anyway only if this is intentionally a duplicate.</p>}
          <button type="button" onClick={() => void submit(duplicateWarning)} disabled={submitting || loadingCalendars || calendars.length === 0} className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "Creating…" : duplicateWarning ? "Create Duplicate Event" : "Create Event"}</button>
        </div>
      </div>
    </div>
  );
}

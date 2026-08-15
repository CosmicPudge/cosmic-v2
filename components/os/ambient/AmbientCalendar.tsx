"use client";

import useCalendar from "@/hooks/os/useCalendar";

function formatEventTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AmbientCalendar() {
  const { calendar, loading, error } = useCalendar();
  const event = calendar?.currentEvent ?? calendar?.nextEvent;
  const isCurrent = Boolean(calendar?.currentEvent);

  if (loading) {
    return <p className="text-sm text-white/40">Reading today’s calendar…</p>;
  }

  if (error) {
    return <p className="text-sm text-white/40">Calendar is unavailable.</p>;
  }

  if (!event) {
    return (
      <div>
        <p className="text-lg font-medium">The rest of today is open</p>
        <p className="mt-1 text-sm text-white/40">No upcoming events.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-lg font-medium text-white/90">{event.title}</p>
      <p className="mt-1 text-sm text-white/45">
        {isCurrent ? "Now" : formatEventTime(event.start)}
        {event.location ? ` · ${event.location}` : ""}
      </p>
    </div>
  );
}

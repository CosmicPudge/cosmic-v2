"use client";

interface Props {
  context?: unknown;
}

export default function CalendarScene({
  context,
}: Props) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-b from-indigo-700 via-slate-900 to-black" />

    </div>
  );
}
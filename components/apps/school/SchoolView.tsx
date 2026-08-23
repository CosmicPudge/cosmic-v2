"use client";

export default function SchoolView() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          School
        </h1>

        <p className="text-white/60">
          The active School workspace lives in the School overview and settings routes.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-white/50">
          This legacy view is retained for compatibility; use the canonical School navigation for terms, courses, assignments, grades, and schedules.
        </p>
      </div>

    </div>
  );
}

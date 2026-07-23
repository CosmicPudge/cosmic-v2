"use client";

interface SchoolMetricProps {
  label: string;
  value: string | number;
  subvalue?: string;
}

export default function SchoolMetric({
  label,
  value,
  subvalue,
}: SchoolMetricProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {value}
      </div>

      {subvalue && (
        <div className="mt-1 text-sm text-white/55">
          {subvalue}
        </div>
      )}
    </div>
  );
}
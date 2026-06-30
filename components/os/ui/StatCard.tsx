"use client";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
}: StatCardProps) {
  return (
    <div className="rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10">
      <p className="text-sm text-white/50">
        {title}
      </p>

      <h2 className="mt-1 text-2xl font-semibold">
        {value}
      </h2>

      {subtitle && (
        <p className="mt-2 text-xs text-white/40">
          {subtitle}
        </p>
      )}
    </div>
  );
}
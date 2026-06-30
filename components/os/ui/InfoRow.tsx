"use client";

interface InfoRowProps {
  label: string;
  value: string;
}

export default function InfoRow({
  label,
  value,
}: InfoRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 last:border-0">
      <span className="text-white/60">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}
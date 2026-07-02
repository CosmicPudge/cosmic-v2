"use client";

interface EmptySurfaceProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export default function EmptySurface({
  icon,
  title,
  description,
}: EmptySurfaceProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">

      <div className="mb-4 text-5xl">
        {icon}
      </div>

      <h2 className="text-2xl font-bold">
        {title}
      </h2>

      <p className="mt-3 max-w-sm text-white/60">
        {description}
      </p>

    </div>
  );
}
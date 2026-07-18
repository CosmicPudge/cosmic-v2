"use client";

import { Clock3, Flag, Sparkles } from "lucide-react";

export interface MissionPanelProps {
  title: string;
  description: string;
  due: string;
  estimatedTime: string;
  priority: "Low" | "Medium" | "High";
}

export default function MissionPanel({
  title,
  description,
  due,
  estimatedTime,
  priority,
}: MissionPanelProps) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-2xl
        p-9
        transition-all
        duration-300
        hover:bg-white/[0.08]
        hover:border-white/20
      "
    >
      <p className="text-xs uppercase tracking-[0.25em] text-violet-300">
        Today's Mission
      </p>

      <h2 className="mt-3 text-5xl lg:text-6xl font-bold tracking-tight text-white">
        {title}
      </h2>

      <p className="mt-3 max-w-2xl text-white/70 leading-7">
        {description}
      </p>

      <div className="mt-7 flex flex-wrap gap-3">

        <InfoChip
          icon={<Clock3 size={16} />}
          label={due}
        />

        <InfoChip
          icon={<Sparkles size={16} />}
          label={estimatedTime}
        />

        <PriorityChip priority={priority} />

      </div>
    </div>
  );
}

function InfoChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-2
        rounded-full
        border
        border-white/10
        bg-white/5
        px-4
        py-2
        text-sm
        text-white/80
      "
    >
      {icon}
      {label}
    </div>
  );
}

function PriorityChip({
  priority,
}: {
  priority: "Low" | "Medium" | "High";
}) {
  const color =
    priority === "High"
      ? "bg-red-500/20 text-red-300 border-red-400/20"
      : priority === "Medium"
      ? "bg-yellow-500/20 text-yellow-300 border-yellow-400/20"
      : "bg-emerald-500/20 text-emerald-300 border-emerald-400/20";

  return (
    <div
      className={`
        flex
        items-center
        gap-2
        rounded-full
        border
        px-4
        py-2
        text-sm
        font-medium
        ${color}
      `}
    >
      <Flag size={15} />
      {priority} Priority
    </div>
  );
}
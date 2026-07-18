"use client";

import {
  BookOpen,
  ClipboardCheck,
  Plane,
  GraduationCap,
} from "lucide-react";

export interface AtAGlanceProps {
  classesToday: number;
  assignmentsDue: number;
  afrotcEvents: number;
  gpa: number;
}

export default function AtAGlance({
  classesToday,
  assignmentsDue,
  afrotcEvents,
  gpa,
}: AtAGlanceProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <QuickStat
        icon={<BookOpen size={20} />}
        label="Classes"
        value={classesToday.toString()}
      />

      <QuickStat
        icon={<ClipboardCheck size={20} />}
        label="Due Today"
        value={assignmentsDue.toString()}
      />

      <QuickStat
        icon={<Plane size={20} />}
        label="AFROTC"
        value={afrotcEvents.toString()}
      />

      <QuickStat
        icon={<GraduationCap size={20} />}
        label="GPA"
        value={gpa.toFixed(2)}
      />
    </div>
  );
}

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function QuickStat({
  icon,
  label,
  value,
}: QuickStatProps) {
  return (
    <div
      className="
        group
        rounded-2xl
        border
        border-white/10
        bg-white/[0.04]
        backdrop-blur-xl
        p-5
        transition-all
        duration-300
        hover:bg-white/[0.08]
        hover:border-white/20
        hover:-translate-y-1
      "
    >
      <div className="flex items-center gap-3 text-violet-300">
        {icon}

        <span className="text-xs uppercase tracking-[0.18em] text-white/50">
          {label}
        </span>
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}
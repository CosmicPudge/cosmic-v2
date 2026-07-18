import Link from "next/link";
import { BookOpen, CalendarDays, ClipboardPlus, Sparkles } from "lucide-react";
import { SchoolCard } from "@/components/school/SchoolCard";
import type { SchoolQuickAction } from "@/lib/school/types";

const actionIcons = {
  assignment: ClipboardPlus,
  schedule: CalendarDays,
  courses: BookOpen,
  study: Sparkles,
} as const;

export function QuickActionsCard({ actions }: { actions: SchoolQuickAction[] }) {
  return (
    <SchoolCard title="Quick actions" eyebrow="Shortcuts">
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ href, label, icon }) => {
          const Icon = actionIcons[icon];

          return (
          <Link key={label} href={href} className="group rounded-2xl border border-white/10 bg-black/10 p-3.5 transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
            <Icon className="size-4 text-sky-100/75 transition group-hover:text-white" aria-hidden="true" />
            <span className="mt-4 block text-xs font-medium text-white/75 group-hover:text-white">{label}</span>
          </Link>
          );
        })}
      </div>
    </SchoolCard>
  );
}

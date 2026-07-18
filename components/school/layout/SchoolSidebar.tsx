import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Flag,
  FolderOpen,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Settings,
  Target,
} from "lucide-react";
import { SemesterSwitcher } from "./SemesterSwitcher";
import { SyncStatus } from "./SyncStatus";

const navigation = [
  { href: "/school", label: "Overview", icon: LayoutGrid },
  { href: "/school/courses", label: "Courses", icon: BookOpen },
  { href: "/school/assignments", label: "Assignments", icon: ListChecks },
  { href: "/school/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/school/grades", label: "Grades", icon: GraduationCap },
  { href: "/school/resources", label: "Resources", icon: FolderOpen },
  { href: "/school/goals", label: "Goals", icon: Target },
  { href: "/school/afrotc", label: "AFROTC", icon: Flag },
];

export function SchoolSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black/10 px-4 py-6 lg:flex">
      <Link href="/school" className="mb-8 flex items-center gap-3 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
        <span className="grid size-9 place-items-center rounded-2xl border border-sky-100/15 bg-sky-200/10 text-sky-100">
          <GraduationCap className="size-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-white">Cosmic School</span>
      </Link>

      <SemesterSwitcher />

      <nav aria-label="School navigation" className="mt-6 space-y-1">
        {navigation.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/school";

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 ${
                isActive
                  ? "bg-white/10 font-medium text-white shadow-sm"
                  : "text-white/55 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <SyncStatus />
        <Link href="/school/settings" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
          <Settings className="size-4" aria-hidden="true" />
          Settings
        </Link>
        <Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
          <Bell className="size-4" aria-hidden="true" />
          Notifications
        </Link>
      </div>
    </aside>
  );
}

export default SchoolSidebar;

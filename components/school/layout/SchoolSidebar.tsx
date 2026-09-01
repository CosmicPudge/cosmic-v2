"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Inbox,
  ArrowLeft,
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
  { href: "/school/inbox", label: "Inbox", icon: Inbox },
  { href: "/school/week", label: "This Week", icon: CalendarDays },
  { href: "/school/courses", label: "Courses", icon: BookOpen },
  { href: "/school/notes", label: "Notes", icon: BookOpen },
  { href: "/school/assignments", label: "Assignments", icon: ListChecks },
  { href: "/school/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/school/sources", label: "Sources", icon: FolderOpen },
  { href: "/school/grades", label: "Grades", icon: GraduationCap },
  { href: "/school/resources", label: "Resources", icon: FolderOpen },
  { href: "/school/goals", label: "Goals", icon: Target },
  { href: "/school/afrotc", label: "AFROTC", icon: Flag },
];

export function SchoolSidebar() {
  const pathname = usePathname();

  return (
    <>
      <header className="border-b border-white/10 bg-black/10 px-4 py-4 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/school" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
            <span className="grid size-9 place-items-center rounded-2xl border border-sky-100/15 bg-sky-200/10 text-sky-100">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">Cosmic School</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/os" className="inline-flex items-center gap-1.5 rounded-xl border border-sky-100/15 bg-sky-200/10 px-3 py-2 text-xs font-medium text-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Cosmic OS
            </Link>
            <Link href="/school/settings" aria-label="School Settings" className="rounded-xl border border-white/10 p-2.5 text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
              <Settings className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <nav aria-label="School mobile navigation" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {navigation.map(({ href, label }) => {
            const isActive = pathname === href;
            return <Link key={href} href={href} aria-current={isActive ? "page" : undefined} className={`shrink-0 rounded-xl border px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 ${isActive ? "border-white/15 bg-white/10 text-white" : "border-white/10 text-white/55"}`}>{label}</Link>;
          })}
        </nav>
      </header>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black/10 px-4 py-6 lg:flex">
      <Link href="/school" className="mb-8 flex items-center gap-3 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
        <span className="grid size-9 place-items-center rounded-2xl border border-sky-100/15 bg-sky-200/10 text-sky-100">
          <GraduationCap className="size-5" aria-hidden="true" />
        </span>
        <span><span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-100/55">Utah State</span><span className="block text-sm font-semibold tracking-tight text-white">Cosmic School</span></span>
      </Link>

      <SemesterSwitcher />

      <nav aria-label="School navigation" className="mt-6 space-y-1">
        {navigation.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;

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
        <Link href="/os" className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-100/75 transition hover:bg-sky-200/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Cosmic OS
        </Link>
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
    </>
  );
}

export default SchoolSidebar;

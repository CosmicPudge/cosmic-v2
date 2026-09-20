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
  type LucideIcon,
} from "lucide-react";
import { SemesterSwitcher } from "./SemesterSwitcher";
import { SyncStatus } from "./SyncStatus";
import { isSchoolNavigationActive, schoolBrandLabel, schoolNavigationGroups } from "@/services/school/studentDemoPresentation";

const icons: Record<string, LucideIcon> = {
  "/school": LayoutGrid,
  "/school/courses": BookOpen,
  "/school/assignments": ListChecks,
  "/school/calendar": CalendarDays,
  "/school/study": BookOpen,
  "/school/resources": FolderOpen,
  "/school/notes": BookOpen,
  "/school/grades": GraduationCap,
  "/school/goals": Target,
  "/school/inbox": Inbox,
  "/school/week": CalendarDays,
  "/school/schedule": CalendarDays,
  "/school/sources": FolderOpen,
  "/school/afrotc": Flag,
  "/school/opords": Flag,
};

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
        <nav aria-label="School mobile navigation" className="mt-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {schoolNavigationGroups.primary.map(({ href, label }) => <MobileLink key={href} href={href} label={label} pathname={pathname} />)}
          </div>
          <details className="group mt-2" open={[...schoolNavigationGroups.secondary, ...schoolNavigationGroups.specialized].some(({ href }) => isSchoolNavigationActive(pathname, href))}>
            <summary className="w-fit cursor-pointer rounded-lg px-2 py-1 text-xs text-white/55 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">More School pages</summary>
            <div className="mt-2 space-y-3 rounded-xl border border-white/10 bg-slate-950/80 p-3">
              <MobileGroup title="More" items={schoolNavigationGroups.secondary} pathname={pathname} />
              <MobileGroup title="Specialized" items={schoolNavigationGroups.specialized} pathname={pathname} />
            </div>
          </details>
        </nav>
      </header>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black/10 px-4 py-6 lg:flex">
      <Link href="/school" className="mb-8 flex items-center gap-3 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">
        <span className="grid size-9 place-items-center rounded-2xl border border-sky-100/15 bg-sky-200/10 text-sky-100">
          <GraduationCap className="size-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-white">{schoolBrandLabel}</span>
      </Link>

      <SemesterSwitcher />

      <nav aria-label="School navigation" className="mt-6 space-y-5">
        <NavigationGroup title="Your School" items={schoolNavigationGroups.primary} pathname={pathname} />
        <NavigationGroup title="More" items={schoolNavigationGroups.secondary} pathname={pathname} />
        <NavigationGroup title="Specialized" items={schoolNavigationGroups.specialized} pathname={pathname} />
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

function MobileLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = isSchoolNavigationActive(pathname, href);
  return <Link href={href} aria-current={active ? "page" : undefined} className={`shrink-0 rounded-xl border px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 ${active ? "border-white/15 bg-white/10 text-white" : "border-white/10 text-white/55"}`}>{label}</Link>;
}

function MobileGroup({ title, items, pathname }: { title: string; items: readonly { href: string; label: string }[]; pathname: string }) {
  return <section><h2 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{title}</h2><div className="flex flex-wrap gap-2">{items.map(({ href, label }) => <MobileLink key={href} href={href} label={label} pathname={pathname} />)}</div></section>;
}

function NavigationGroup({ title, items, pathname }: { title: string; items: readonly { href: string; label: string }[]; pathname: string }) {
  return <section><h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">{title}</h2><div className="space-y-1">{items.map(({ href, label }) => {
    const Icon = icons[href];
    const active = isSchoolNavigationActive(pathname, href);
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 ${active ? "bg-white/10 font-medium text-white shadow-sm" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`}><Icon className="size-4" aria-hidden="true" />{label}</Link>;
  })}</div></section>;
}

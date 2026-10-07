"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Overview", href: "/school" },
  { label: "Courses", href: "/school/courses" },
  { label: "Assignments", href: "/school/assignments" },
  { label: "Calendar", href: "/school/calendar" },
  { label: "Analytics", href: "/school/analytics" },
] as const;

export default function SchoolTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="School sections" className="mb-6 flex flex-wrap gap-2 px-1">
      {tabs.map((tab) => {
        const active = tab.href === "/school" ? pathname === "/school" : pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl border px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-cyan-200 ${active ? "border-violet-300/25 bg-violet-400/10 text-white" : "border-white/8 bg-white/[0.025] text-white/50 hover:bg-white/[0.05] hover:text-white"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

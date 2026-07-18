import Link from "next/link";
import { Megaphone } from "lucide-react";
import { SchoolCard, SchoolEmptyState } from "@/components/school/SchoolCard";
import type { SchoolAnnouncement } from "@/lib/school/types";

export function AnnouncementsCard({ announcements }: { announcements: SchoolAnnouncement[] }) {
  const orderedAnnouncements = [...announcements].sort((first, second) => Number(second.unread) - Number(first.unread));

  return (
    <SchoolCard title="Announcements" eyebrow="From your courses" actionHref="/school/courses">
      <ul className="space-y-2">
        {orderedAnnouncements.map((announcement) => (
          <li key={announcement.id}>
            <Link href="/school/courses" className={`block rounded-2xl px-3 py-3 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 ${announcement.unread ? "bg-white/[0.045]" : ""}`}>
              <span className="flex items-start gap-2"><Megaphone className={`mt-0.5 size-3.5 shrink-0 ${announcement.unread ? "text-sky-100" : "text-white/30"}`} aria-hidden="true" /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium text-white">{announcement.title}</span>{announcement.unread && <span className="size-1.5 shrink-0 rounded-full bg-sky-200" aria-label="Unread" />}</span><span className="mt-1 block text-xs text-white/40">{announcement.courseCode} · {announcement.publishedLabel}</span><span className="mt-1.5 block line-clamp-2 text-xs leading-5 text-white/55">{announcement.summary}</span></span></span>
            </Link>
          </li>
        ))}
        {orderedAnnouncements.length === 0 && <li><SchoolEmptyState>Course announcements will appear here when a provider connects.</SchoolEmptyState></li>}
      </ul>
    </SchoolCard>
  );
}

import Link from "next/link";
import { CalendarPlus, Command, Search } from "lucide-react";
import { SchoolBreadcrumbs } from "./SchoolBreadcrumbs";

interface SchoolHeaderProps {
  title: string;
  subtitle: string;
}

export function SchoolHeader({ title, subtitle }: SchoolHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <SchoolBreadcrumbs currentPage={title} />
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/50 sm:text-base">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/school/resources" className="cosmic-button cosmic-button-secondary h-10 px-3 text-sm">
          <Search className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded-md border border-white/10 bg-black/10 px-1.5 py-0.5 text-[0.65rem] text-white/40 md:inline">⌘ K</kbd>
        </Link>
        <Link href="/school/schedule" className="cosmic-button cosmic-button-primary h-10 px-3.5 text-sm">
          <CalendarPlus className="size-4" aria-hidden="true" />
          Plan
          <Command className="size-3.5 opacity-50" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

export default SchoolHeader;

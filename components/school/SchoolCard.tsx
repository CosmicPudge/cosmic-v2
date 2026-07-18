import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface SchoolCardProps {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  tone?: "default" | "focus" | "mission";
}

export function SchoolCard({
  children,
  title,
  eyebrow,
  actionHref,
  actionLabel = "View all",
  className = "",
  tone = "default",
}: SchoolCardProps) {
  const toneClass = {
    default: "",
    focus: "border-sky-100/15 bg-sky-100/[0.055]",
    mission: "border-amber-100/15 bg-amber-100/[0.055]",
  }[tone];

  return (
    <section
      className={`group relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_-34px_rgba(0,0,0,0.75)] backdrop-blur-2xl transition duration-200 ease-out hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.075] hover:shadow-[0_30px_90px_-34px_rgba(0,0,0,0.85)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6 ${toneClass} ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-50" aria-hidden="true" />
      {(title || eyebrow) && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {eyebrow && (
              <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>}
          </div>
          {actionHref && (
            <Link
              href={actionHref}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-sky-100/80 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c18]"
            >
              {actionLabel}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-white/50">
        <span>{label}</span>
        <span className="font-medium tabular-nums text-white/75">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-300 transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function SchoolEmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center text-sm leading-6 text-white/45">{children}</p>;
}

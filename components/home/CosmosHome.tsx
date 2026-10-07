"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Car,
  CircleDollarSign,
  Dumbbell,
  FolderKanban,
  GraduationCap,
  ListTodo,
  Music2,
  NotebookPen,
  Radio,
  Sparkles,
} from "lucide-react";

import AppHeader from "@/components/os/app/AppHeader";
import CosmicCard from "@/design-system/components/CosmicCard";
import StatusChip from "@/components/os/ui/StatusChip";
import Skeleton from "@/components/os/ui/Skeleton";
import { type HomeSummary, useHomeSummaries } from "@/components/home/useHomeSummaries";

type SummaryCard = {
  key: keyof ReturnType<typeof useHomeSummaries>;
  title: string;
  eyebrow: string;
  href: string;
  icon: typeof GraduationCap;
  className?: string;
};

const primaryCards: SummaryCard[] = [
  { key: "school", title: "School", eyebrow: "Academics", href: "/school", icon: GraduationCap, className: "lg:col-span-2" },
  { key: "calendar", title: "Calendar", eyebrow: "Schedule", href: "/calendar", icon: CalendarDays },
  { key: "tasks", title: "Tasks", eyebrow: "Focus", href: "/tasks", icon: ListTodo },
  { key: "finance", title: "Finance", eyebrow: "Money guardrail", href: "/finance", icon: CircleDollarSign, className: "lg:col-span-2" },
];

const lifeCards: SummaryCard[] = [
  { key: "health", title: "Health", eyebrow: "Today", href: "/health", icon: Dumbbell },
  { key: "garage", title: "Garage", eyebrow: "Vehicles", href: "/garage", icon: Car },
  { key: "sports", title: "Sports", eyebrow: "Watching", href: "/sports", icon: Radio },
];

const buildCards: SummaryCard[] = [
  { key: "projects", title: "Projects", eyebrow: "Build", href: "/projects", icon: FolderKanban },
  { key: "notes", title: "Notes", eyebrow: "Brain", href: "/notes", icon: NotebookPen },
  { key: "media", title: "Media", eyebrow: "Entertainment", href: "/media", icon: Music2 },
];

function stateLabel(state: HomeSummary["state"]) {
  if (state === "error") return <StatusChip variant="danger">Unavailable</StatusChip>;
  if (state === "empty") return <StatusChip variant="neutral">No data</StatusChip>;
  return null;
}

function SummaryCardView({ card, summary }: { card: SummaryCard; summary: HomeSummary }) {
  const Icon = card.icon;
  return (
    <Link href={card.href} className={`group block min-w-0 ${card.className ?? ""}`}>
      <CosmicCard interactive className="h-full p-5 sm:p-6">
        <div className="flex h-full min-h-[150px] flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/15 bg-violet-400/[0.08] text-violet-100">
              <Icon size={20} />
            </div>
            <div className="flex items-center gap-2">
              {stateLabel(summary.state)}
              <ArrowUpRight size={17} className="text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/65" />
            </div>
          </div>

          <div className="mt-auto pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{card.eyebrow}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-white">{card.title}</h2>
              {summary.state === "loading" ? (
                <Skeleton className="h-4 w-24 rounded-md" />
              ) : (
                <span className="text-sm font-medium text-cyan-100/80">{summary.value}</span>
              )}
            </div>
            {summary.state === "loading" ? (
              <Skeleton className="mt-3 h-4 w-4/5 rounded-md" />
            ) : (
              <p className="mt-2 text-sm leading-5 text-white/48">{summary.detail}</p>
            )}
          </div>
        </div>
      </CosmicCard>
    </Link>
  );
}

function SummarySection({
  kicker,
  title,
  cards,
  summaries,
  columns,
  hint,
}: {
  kicker: string;
  title: string;
  cards: SummaryCard[];
  summaries: ReturnType<typeof useHomeSummaries>;
  columns: string;
  hint?: string;
}) {
  return (
    <section aria-labelledby={`home-${title.toLowerCase()}-heading`}>
      <div className="mb-3 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/55">{kicker}</p>
          <h2 id={`home-${title.toLowerCase()}-heading`} className="mt-1 text-lg font-semibold tracking-tight text-white">{title}</h2>
        </div>
        {hint ? <p className="hidden text-xs text-white/30 sm:block">{hint}</p> : null}
      </div>
      <div className={`grid gap-3 ${columns}`}>
        {cards.map((card) => <SummaryCardView key={card.title} card={card} summary={summaries[card.key]} />)}
      </div>
    </section>
  );
}

export default function CosmosHome({ showPreviewBadge = true }: { showPreviewBadge?: boolean }) {
  const summaries = useHomeSummaries();

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <AppHeader
        eyebrow="Home"
        title="Everything in orbit."
        subtitle="A fast view of what matters now, with every card opening the place where the real work happens."
        rightContent={showPreviewBadge ? <StatusChip variant="primary" icon={<Sparkles size={13} />}>Milestone 1 · live data</StatusChip> : undefined}
      />

      <div className="space-y-8 px-1 py-5 sm:px-2 sm:py-7">
        <SummarySection
          kicker="Right now"
          title="Today"
          cards={primaryCards}
          summaries={summaries}
          columns="sm:grid-cols-2 lg:grid-cols-4"
          hint="Glanceable in a few seconds."
        />

        <SummarySection
          kicker="Personal"
          title="Life"
          cards={lifeCards}
          summaries={summaries}
          columns="md:grid-cols-3"
        />

        <SummarySection
          kicker="Create & capture"
          title="Build"
          cards={buildCards}
          summaries={summaries}
          columns="md:grid-cols-3"
        />
      </div>
    </div>
  );
}

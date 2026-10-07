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

type SummaryCard = {
  title: string;
  eyebrow: string;
  value: string;
  detail: string;
  href: string;
  icon: typeof GraduationCap;
  className?: string;
};

const primaryCards: SummaryCard[] = [
  {
    title: "School",
    eyebrow: "Academics",
    value: "3.42 GPA",
    detail: "2 assignments due soon · next class at 1:30 PM",
    href: "/school",
    icon: GraduationCap,
    className: "lg:col-span-2",
  },
  {
    title: "Calendar",
    eyebrow: "Schedule",
    value: "3 events today",
    detail: "Next up · Chemistry at 1:30 PM",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "Tasks",
    eyebrow: "Focus",
    value: "6 open",
    detail: "2 high priority · 3 due this week",
    href: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Finance",
    eyebrow: "Money guardrail",
    value: "$184 safe to spend",
    detail: "Bills and protected savings already reserved",
    href: "/finance",
    icon: CircleDollarSign,
    className: "lg:col-span-2",
  },
];

const lifeCards: SummaryCard[] = [
  {
    title: "Health",
    eyebrow: "Today",
    value: "Workout ready",
    detail: "PFA training · 42 minutes",
    href: "/health",
    icon: Dumbbell,
  },
  {
    title: "Garage",
    eyebrow: "Vehicles",
    value: "2 vehicles",
    detail: "1 maintenance item needs attention",
    href: "/garage",
    icon: Car,
  },
  {
    title: "Sports",
    eyebrow: "Watching",
    value: "3 upcoming",
    detail: "Packers · Angels · race weekend",
    href: "/sports",
    icon: Radio,
  },
];

const buildCards: SummaryCard[] = [
  {
    title: "Projects",
    eyebrow: "Build",
    value: "4 active",
    detail: "Cosmos · engineering · personal work",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Notes",
    eyebrow: "Brain",
    value: "12 recent",
    detail: "Capture ideas before they disappear",
    href: "/notes",
    icon: NotebookPen,
  },
  {
    title: "Media",
    eyebrow: "Entertainment",
    value: "Nothing playing",
    detail: "Music, shows, games, and watchlist",
    href: "/media",
    icon: Music2,
  },
];

function SummaryCardView({ card }: { card: SummaryCard }) {
  const Icon = card.icon;
  return (
    <Link href={card.href} className={`group block min-w-0 ${card.className ?? ""}`}>
      <CosmicCard interactive className="h-full p-5 sm:p-6">
        <div className="flex h-full min-h-[150px] flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/15 bg-violet-400/[0.08] text-violet-100">
              <Icon size={20} />
            </div>
            <ArrowUpRight size={17} className="text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/65" />
          </div>
          <div className="mt-auto pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{card.eyebrow}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-white">{card.title}</h2>
              <span className="text-sm font-medium text-cyan-100/80">{card.value}</span>
            </div>
            <p className="mt-2 text-sm leading-5 text-white/48">{card.detail}</p>
          </div>
        </div>
      </CosmicCard>
    </Link>
  );
}

export default function CosmosHome({ showPreviewBadge = true }: { showPreviewBadge?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <AppHeader
        eyebrow="Home"
        title="Everything in orbit."
        subtitle="A fast view of what matters now, with every card opening the place where the real work happens."
        rightContent={showPreviewBadge ? <StatusChip variant="warning" icon={<Sparkles size={13} />}>Milestone 1 · mock data</StatusChip> : undefined}
      />

      <div className="space-y-8 px-1 py-5 sm:px-2 sm:py-7">
        <section aria-labelledby="home-today-heading">
          <div className="mb-3 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/55">Right now</p>
              <h2 id="home-today-heading" className="mt-1 text-lg font-semibold tracking-tight text-white">Today</h2>
            </div>
            <p className="hidden text-xs text-white/30 sm:block">Glanceable in a few seconds.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {primaryCards.map((card) => <SummaryCardView key={card.title} card={card} />)}
          </div>
        </section>

        <section aria-labelledby="home-life-heading">
          <div className="mb-3 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/50">Personal</p>
            <h2 id="home-life-heading" className="mt-1 text-lg font-semibold tracking-tight text-white">Life</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {lifeCards.map((card) => <SummaryCardView key={card.title} card={card} />)}
          </div>
        </section>

        <section aria-labelledby="home-build-heading">
          <div className="mb-3 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200/50">Create & capture</p>
            <h2 id="home-build-heading" className="mt-1 text-lg font-semibold tracking-tight text-white">Build</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {buildCards.map((card) => <SummaryCardView key={card.title} card={card} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

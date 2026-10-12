"use client";

import Link from "next/link";
import {
  ArrowUpRight, CalendarDays, CarFront, CircleDollarSign, Dumbbell,
  FolderKanban, GraduationCap, ListTodo, Music2, NotebookPen, Radio, Sparkles,
} from "lucide-react";

import AppHeader from "@/components/os/app/AppHeader";
import CosmicCard from "@/design-system/components/CosmicCard";
import StatusChip from "@/components/os/ui/StatusChip";
import Skeleton from "@/components/os/ui/Skeleton";
import { type HomeSummary, useHomeSummaries } from "@/components/home/useHomeSummaries";
import "./cosmos-home.css";

type SummaryCard = {
  key: keyof ReturnType<typeof useHomeSummaries>;
  title: string;
  eyebrow: string;
  href: string;
  icon: typeof GraduationCap;
  className?: string;
};

const todayCards: SummaryCard[] = [
  { key: "school", title: "School", eyebrow: "Academics", href: "/school", icon: GraduationCap },
  { key: "calendar", title: "Calendar", eyebrow: "Schedule", href: "/calendar", icon: CalendarDays },
  { key: "tasks", title: "Tasks", eyebrow: "Focus", href: "/tasks", icon: ListTodo },
];
const priorityCards: SummaryCard[] = [
  { key: "finance", title: "Finance", eyebrow: "Money guardrail", href: "/finance", icon: CircleDollarSign },
  { key: "projects", title: "Projects", eyebrow: "Creative work", href: "/projects", icon: FolderKanban },
];
const lifeCards: SummaryCard[] = [
  { key: "health", title: "Health", eyebrow: "Wellness", href: "/health", icon: Dumbbell },
  { key: "garage", title: "Garage", eyebrow: "Vehicles", href: "/garage", icon: CarFront },
  { key: "sports", title: "Sports", eyebrow: "Activity", href: "/sports", icon: Radio },
  { key: "media", title: "Media", eyebrow: "Entertainment", href: "/media", icon: Music2 },
];
const captureCards: SummaryCard[] = [
  { key: "notes", title: "Notes / Brain", eyebrow: "Capture", href: "/notes", icon: NotebookPen },
];

function stateLabel(state: HomeSummary["state"]) {
  if (state === "error") return <StatusChip variant="danger">Unavailable</StatusChip>;
  if (state === "empty") return <StatusChip variant="neutral">No data</StatusChip>;
  return null;
}

function SummaryCardView({ card, summary }: { card: SummaryCard; summary: HomeSummary }) {
  const Icon = card.icon;
  return (
    <Link href={card.href} aria-label={`Open ${card.title}`}
      className={`cosmos-home-card-link group block min-w-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200 ${card.className ?? ""}`}>
      <CosmicCard interactive className="cosmos-home-card h-full p-4 sm:p-5">
        <div className="flex h-full min-h-[155px] flex-col">
          <div className="flex items-start justify-between gap-3">
            <span className="cosmos-home-card-icon grid h-10 w-10 place-items-center rounded-xl text-violet-100">
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="flex items-center gap-2">
              {stateLabel(summary.state)}
              <ArrowUpRight size={17} aria-hidden="true" className="text-white/45 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
          <div className="mt-auto pt-5">
            <p className="cosmos-home-kicker">{card.eyebrow}</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">{card.title}</h3>
            {summary.state === "loading" ? <Skeleton className="mt-2 h-4 w-28 rounded-md" /> : (
              <p className="mt-1 text-sm font-medium text-violet-100/85">{summary.value}</p>
            )}
            {summary.state === "loading" ? <Skeleton className="mt-2 h-4 w-4/5 rounded-md" /> : (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/65">{summary.detail}</p>
            )}
          </div>
        </div>
      </CosmicCard>
    </Link>
  );
}

function SectionTitle({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return <div className="mb-3 px-1">
    <p className="cosmos-home-kicker">{eyebrow}</p>
    <h2 id={id} className="mt-1 text-lg font-semibold tracking-tight text-white">{title}</h2>
  </div>;
}

export default function CosmosHome({ showPreviewBadge = true }: { showPreviewBadge?: boolean }) {
  const summaries = useHomeSummaries();
  return (
    <div className="cosmos-home relative mx-auto w-full max-w-[1500px] pb-12">
      <AppHeader
        eyebrow="Home"
        title="Everything in orbit."
        subtitle="A fast view of what matters now, with every card opening the place where the real work happens."
        rightContent={showPreviewBadge ? <StatusChip variant="primary" icon={<Sparkles size={13} />}>Milestone 1 · live data</StatusChip> : undefined}
      />
      <div className="cosmos-home-sections space-y-7 px-1 py-5 sm:px-2 sm:py-6">
        <section aria-labelledby="home-today">
          <SectionTitle eyebrow="Right now" title="Today" id="home-today" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {todayCards.map(card => <SummaryCardView key={card.key} card={card} summary={summaries[card.key]} />)}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {priorityCards.map(card => <SummaryCardView key={card.key} card={card} summary={summaries[card.key]} />)}
          </div>
        </section>
        <section aria-labelledby="home-life">
          <SectionTitle eyebrow="Personal" title="Life" id="home-life" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {lifeCards.map(card => <SummaryCardView key={card.key} card={card} summary={summaries[card.key]} />)}
          </div>
        </section>
        <section aria-labelledby="home-capture">
          <SectionTitle eyebrow="Create & capture" title="Your ideas" id="home-capture" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {captureCards.map(card => <SummaryCardView key={card.key} card={card} summary={summaries[card.key]} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

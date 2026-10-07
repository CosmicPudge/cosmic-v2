import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, Gauge, GraduationCap, HeartPulse, ListTodo, Wrench } from "lucide-react";

import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import CosmicCard from "@/design-system/components/CosmicCard";
import StatusChip from "@/components/os/ui/StatusChip";
import ProgressBar from "@/components/os/ui/ProgressBar";
import CosmosState from "@/components/os/ui/CosmosState";
import { getFoundationProgress } from "@/config/cosmosMilestones";

const demoCards = [
  { title: "School", value: "3.42 GPA", detail: "2 assignments due soon", icon: GraduationCap },
  { title: "Calendar", value: "3 events", detail: "Next: Chemistry · 1:30 PM", icon: CalendarDays },
  { title: "Tasks", value: "6 open", detail: "2 high priority", icon: ListTodo },
  { title: "Finance", value: "$184 safe", detail: "Bills and savings protected", icon: CircleDollarSign },
  { title: "Health", value: "Workout ready", detail: "PFA training · 42 min", icon: HeartPulse },
  { title: "Garage", value: "2 vehicles", detail: "1 maintenance item due", icon: Wrench },
];

export default function CosmosFoundationPreviewPage() {
  const { completed, total, percent } = getFoundationProgress();
  return (
    <AppShell>
      <AppHeader
        eyebrow="Milestone 0 · Foundation Preview"
        title="Cosmos"
        subtitle="A live visual sandbox for the shared shell, navigation, top bar, glass system, cards, status patterns, and responsive behavior."
        rightContent={
          <Link
            href="/cosmos-progress"
            className="inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-400/15"
          >
            View build tracker <ArrowRight size={16} />
          </Link>
        }
        tabs={[
          { id: "overview", label: "Overview", active: true },
          { id: "widgets", label: "Widgets" },
          { id: "states", label: "States" },
          { id: "responsive", label: "Responsive" },
        ]}
      />

      <AppContent>
        <div className="space-y-8 p-4 sm:p-6 lg:p-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {demoCards.map(({ title, value, detail, icon: Icon }) => (
              <CosmicCard key={title} interactive className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">{title}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
                    <p className="mt-1 text-sm text-white/50">{detail}</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/15 bg-violet-400/[0.08] text-violet-200">
                    <Icon size={20} />
                  </div>
                </div>
              </CosmicCard>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
            <CosmicCard className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Foundation completion</p>
                  <h2 className="mt-2 text-xl font-semibold">Milestone 0 UI systems</h2>
                </div>
                <StatusChip variant="primary">In progress</StatusChip>
              </div>
              <div className="mt-6">
                <ProgressBar value={percent} showValue animated={false} label={`Milestone 0 · ${completed}/${total} checks`} />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                  <p className="text-sm text-white/45">Shell</p>
                  <p className="mt-1 text-lg font-semibold">Ready</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                  <p className="text-sm text-white/45">Navigation</p>
                  <p className="mt-1 text-lg font-semibold">Ready</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                  <p className="text-sm text-white/45">QA</p>
                  <p className="mt-1 text-lg font-semibold">{percent === 100 ? "Complete" : "Pending"}</p>
                </div>
              </div>
            </CosmicCard>

            <CosmicCard className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Gauge className="text-cyan-200" size={20} />
                <h2 className="text-lg font-semibold">Shared states</h2>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <StatusChip variant="success">Ready</StatusChip>
                <StatusChip variant="warning">Needs attention</StatusChip>
                <StatusChip variant="danger">Error</StatusChip>
                <StatusChip variant="neutral">Unavailable</StatusChip>
              </div>
              <div className="mt-6 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.05] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-200" size={18} />
                  <div>
                    <p className="text-sm font-medium">Foundation shell mounted</p>
                    <p className="mt-1 text-xs leading-5 text-white/45">This page intentionally uses the real shared Cosmos shell so sidebar, top bar, surfaces, spacing, and responsive behavior are visible together.</p>
                  </div>
                </div>
              </div>
            </CosmicCard>
          </section>

          <section className="grid gap-3 lg:grid-cols-3">
            <CosmosState kind="loading" title="Loading state" message="Shared loading treatment used across Cosmos modules." />
            <CosmosState kind="empty" title="Empty state" message="A calm default when a module has no data yet." />
            <CosmosState kind="error" title="Error state" message="A consistent recoverable error pattern for failed modules." />
          </section>

          <CosmicCard className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">How to use this screen</p>
            <h2 className="mt-2 text-xl font-semibold">Milestone 0 visual QA sandbox</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              As shared components change, this page updates with them. Resize the browser, open the mobile menu, use search, click navigation, and compare glass surfaces here. Milestone 0 cannot close until both this foundation preview and the progress tracker are live, working, and at 100%. Current shared progress: {percent}%.
            </p>
          </CosmicCard>
        </div>
      </AppContent>
    </AppShell>
  );
}

"use client";

import { DailyBriefing, DailyPlan } from "../data/intelligence";

interface DailyBriefingCardProps {
  briefing: DailyBriefing;
  plan: DailyPlan;
}

export default function DailyBriefingCard({
  briefing,
  plan,
}: DailyBriefingCardProps) {
  const workloadStyles = {
    light:
      "from-emerald-500/10 to-emerald-400/5 border-emerald-500/20",
    moderate:
      "from-blue-500/10 to-cyan-500/5 border-blue-500/20",
    heavy:
      "from-amber-500/10 to-orange-500/5 border-amber-500/20",
    critical:
      "from-red-500/10 to-red-400/5 border-red-500/20",
  };

  const progress = Math.max(
    0,
    Math.min(100, briefing.assignmentCompletion)
  );

  return (
    <section
      className={`
        relative overflow-hidden rounded-3xl
        border backdrop-blur-xl
        bg-gradient-to-br
        ${workloadStyles[briefing.workload]}
        bg-white/5
        p-8
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-2xl
      `}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_45%)] pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div>
          <p className="text-sm font-medium text-white/60">
            {briefing.greeting}
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {briefing.headline}
          </h1>

          <p className="mt-3 text-white/70">
            {briefing.summary}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">
              Assignment Progress
            </span>

            <span className="font-semibold text-white">
              {progress}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Study Today"
            value={`${briefing.estimatedStudyMinutes} min`}
          />

          <StatCard
            title="Notifications"
            value={String(briefing.notificationCount)}
          />

          <StatCard
            title="Workload"
            value={capitalize(briefing.workload)}
          />
        </div>

        {/* Mission */}
        <div className="grid gap-3 md:grid-cols-2">
          {([["TODAY", briefing.school.today], ["TOMORROW", briefing.school.tomorrow], ["BRING", briefing.school.bring], ["WEAR", briefing.school.wear], ["PREPARE", briefing.school.prepare], ["OFFICE HOURS", briefing.school.officeHours], ["SUGGESTED REVIEW", briefing.school.suggestedReview.map((item) => `${item.value} · ${item.source}`)] ] as const).filter(([, items]) => items.length > 0).map(([label, items]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-wider text-white/50">{label}</p><ul className="mt-2 space-y-1 text-sm text-white/70">{items.slice(0, 5).map((item) => <li key={item}>• {item}</li>)}</ul></div>)}
        </div>

        {/* Mission */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-wider text-white/50">
            Today&apos;s Mission
          </p>

          {plan.nextTask ? (
            <>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {plan.nextTask.title}
              </h2>

              <p className="mt-2 text-white/70">
                {plan.nextTask.reason}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/60">
                <span>{plan.nextTask.dueLabel}</span>

                <span>•</span>

                <span>
                  {plan.nextTask.estimatedMinutes} min
                </span>

                {plan.nextTask.course && (
                  <>
                    <span>•</span>
                    <span>{plan.nextTask.course}</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-xl font-semibold text-white">
                You&apos;re all caught up 🎉
              </h2>

              <p className="mt-2 text-white/70">
                No urgent assignments right now.
                Enjoy the momentum.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

interface StatCardProps {
  title: string;
  value: string;
}

function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-white/60">
        {title}
      </p>

      <p className="mt-2 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

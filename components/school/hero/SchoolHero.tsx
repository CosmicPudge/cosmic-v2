"use client";

import { motion } from "framer-motion";

import AmbientBackground from "./AmbientBackground";
import HeroHeader from "./HeroHeader";
import MissionPanel from "./MissionPanel";
import AtAGlance from "./AtAGlance";
import SemesterProgress from "./SemesterProgress";

import GlassPanel from "@/components/os/ui/GlassPanel";
import HeroTitle from "@/components/os/ui/HeroTitle";

import type { SchoolDashboardData } from "../data/types";
import type { SchoolIntelligence } from "../data/intelligence/service";

interface SchoolHeroProps {
  data: SchoolDashboardData;
  intelligence: SchoolIntelligence;
}

export default function SchoolHero({
  data,
  intelligence,
}: SchoolHeroProps) {
  const { briefing, plan, metrics } = intelligence;

  const task = plan.nextTask;
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 24,
        scale: 0.985,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <GlassPanel
        variant="hero"
        className="
          relative
          min-h-[760px]
          overflow-hidden
        "
      >
        <AmbientBackground />

        <div className="relative z-10 p-12 lg:p-16 xl:p-20">
          <div className="mx-auto flex max-w-6xl flex-col space-y-14">

            <HeroTitle
              eyebrow={briefing.greeting}
              title="Mission Control"
              headline={briefing.headline}
              description={briefing.summary}
            />

            <HeroHeader location="Logan, Utah" />

            <Divider />

            <div>
              <p className="mb-5 text-xl font-medium text-white/80">
                {plan.todayGoal}
              </p>

              <MissionPanel
                title={task?.title ?? "Everything Complete"}
                description={
                  task?.reason ??
                  "You have completed every assignment."
                }
                due={task?.dueLabel ?? "No deadlines"}
                estimatedTime={
                  task
                    ? `${task.estimatedMinutes} min`
                    : "—"
                }
                priority={task?.priority ?? "Low"}
              />
            </div>

            <Divider />

            <AtAGlance
              classesToday={metrics.classesToday}
              assignmentsDue={metrics.overdueAssignments}
              afrotcEvents={data.stats.afrotcEvents}
              gpa={3.84}
            />

            <Divider />

            <SemesterProgress
              semester={{
                name: data.semester.semester,
                week: data.semester.week,
                progress: data.semester.progress,
              }}
            />
          </div>
        </div>
      </GlassPanel>
    </motion.section>
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";

  return "Good Evening";
}

function buildHeadline(data: SchoolDashboardData) {
  if (data.stats.assignmentsDueToday > 0) {
    return "You have important work due today.";
  }

  if (data.stats.classesToday > 0) {
    return "You're on track today.";
  }

  return "Everything is caught up.";
}

function buildStatusText(data: SchoolDashboardData) {
  if (data.stats.assignmentsDueToday > 0) {
    return `${data.stats.assignmentsDueToday} assignment${data.stats.assignmentsDueToday === 1 ? "" : "s"
      } due today.`;
  }

  if (data.stats.classesToday > 0) {
    return `${data.stats.classesToday} class${data.stats.classesToday === 1 ? "" : "es"
      } scheduled today.`;
  }

  return "Nothing scheduled today.";
}

function toPriority(priority: "low" | "medium" | "high") {
  switch (priority) {
    case "high":
      return "High";

    case "medium":
      return "Medium";

    default:
      return "Low";
  }
}

function Divider() {
  return (
    <div
      className="
        h-px
        w-full
        bg-gradient-to-r
        from-transparent
        via-white/10
        to-transparent
      "
    />
  );
}
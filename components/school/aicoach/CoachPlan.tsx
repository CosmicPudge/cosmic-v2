"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ListOrdered,
} from "lucide-react";

import {
  formatMinutes,
  getPriorityAppearance,
} from "./coachHelpers";
import { CoachTask } from "./coachTypes";

interface CoachPlanProps {
  tasks: CoachTask[];
}

export default function CoachPlan({
  tasks,
}: CoachPlanProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <ListOrdered
            size={20}
            className="text-cyan-300"
          />

          <h2 className="text-2xl font-semibold text-white">
            Today's Plan
          </h2>
        </div>

        <p className="mt-2 text-white/60">
          Follow this recommended order to maximize
          productivity and reduce deadline risk.
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map((task, index) => (
          <PlanItem
            key={task.id}
            task={task}
            step={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

interface PlanItemProps {
  task: CoachTask;
  step: number;
}

function PlanItem({
  task,
  step,
}: PlanItemProps) {
  const appearance =
    getPriorityAppearance(task.priority);

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        x: -15,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        delay: step * 0.05,
      }}
      className={`
        rounded-3xl
        border
        backdrop-blur-3xl
        bg-white/[0.04]
        p-6
        ${appearance.borderClass}
      `}
    >
      <div className="flex gap-5">
        {/* Step */}

        <div
          className="
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            border-cyan-500/20
            bg-cyan-500/10
            text-lg
            font-bold
            text-cyan-300
          "
        >
          {step}
        </div>

        {/* Content */}

        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {task.title}
              </h3>

              {task.course && (
                <div className="mt-2 text-sm text-white/50">
                  {task.course.code}
                </div>
              )}
            </div>

            <div
              className={`
                rounded-full
                border
                px-3
                py-1
                text-xs
                font-semibold
                uppercase
                tracking-[0.15em]
                ${appearance.borderClass}
                ${appearance.accentClass}
              `}
            >
              {appearance.label}
            </div>
          </div>

          {task.description && (
            <p className="mt-4 leading-relaxed text-white/65">
              {task.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-6 text-sm text-white/55">
            <div className="flex items-center gap-2">
              <Clock3 size={16} />

              {formatMinutes(
                task.estimatedMinutes
              )}
            </div>

            {task.dueDate && (
              <div>
                Due{" "}
                {task.dueDate.toLocaleDateString()}
              </div>
            )}
          </div>

          <motion.button
            whileHover={{
              x: 3,
            }}
            whileTap={{
              scale: 0.98,
            }}
            className="
              mt-6
              flex
              items-center
              gap-2
              rounded-2xl
              border
              border-white/10
              bg-white/5
              px-5
              py-3
              text-white
              transition-all
              hover:border-white/20
              hover:bg-white/10
            "
          >
            {task.completed ? (
              <>
                <CheckCircle2 size={16} />

                Completed
              </>
            ) : (
              <>
                Start Task

                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
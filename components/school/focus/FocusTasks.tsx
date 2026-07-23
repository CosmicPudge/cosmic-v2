"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import {
  formatMinutes,
  getCategoryIcon,
  getCategoryLabel,
  getPriorityAppearance,
  getProgressLabel,
  sortFocusTasks,
} from "./focusHelpers";
import { FocusTask } from "./focusTypes";

interface FocusTasksProps {
  tasks: FocusTask[];
}

export default function FocusTasks({
  tasks,
}: FocusTasksProps) {
  const sortedTasks = sortFocusTasks(tasks);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          Up Next
        </p>

        <h3 className="mt-2 text-2xl font-bold text-white">
          Recommended Tasks
        </h3>
      </div>

      <div className="space-y-3">
        {sortedTasks.map((task, index) => {
          const appearance = getPriorityAppearance(
            task.priority
          );

          const CategoryIcon = getCategoryIcon(
            task.category
          );

          return (
            <motion.div
              key={task.id}
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              whileHover={{
                y: -2,
              }}
              className={`
                group
                relative
                overflow-hidden
                rounded-2xl
                border
                bg-white/[0.04]
                backdrop-blur-xl
                transition-all
                duration-300
                hover:bg-white/[0.06]
                ${appearance.borderClass}
              `}
            >
              {/* Accent */}

              <div
                className={`
                  absolute
                  left-0
                  top-0
                  h-full
                  w-1
                  ${appearance.accentClass}
                `}
              />

              {/* Glow */}

              <div
                className={`
                  absolute
                  inset-0
                  bg-gradient-to-r
                  ${appearance.glowClass}
                  opacity-0
                  transition-opacity
                  duration-300
                  group-hover:opacity-100
                `}
              />

              <div className="relative flex items-center gap-4 p-5">
                <div
                  className={`
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-white/5
                    ${appearance.iconClass}
                  `}
                >
                  <CategoryIcon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-semibold text-white">
                      {task.title}
                    </h4>

                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-white/50">
                      {getCategoryLabel(task.category)}
                    </span>
                  </div>

                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-white/60">
                      {task.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/45">
                    {task.dueText && (
                      <span>{task.dueText}</span>
                    )}

                    {task.estimatedMinutes && (
                      <span>
                        {formatMinutes(
                          task.estimatedMinutes
                        )}
                      </span>
                    )}

                    {typeof task.progress ===
                      "number" && (
                      <span>
                        {getProgressLabel(
                          task.progress
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {task.action && (
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-white/10
                      bg-white/5
                      px-4
                      py-2
                      text-sm
                      text-white
                      transition-all
                      hover:border-white/20
                      hover:bg-white/10
                    "
                  >
                    {task.action.label}

                    <ArrowRight size={14} />
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
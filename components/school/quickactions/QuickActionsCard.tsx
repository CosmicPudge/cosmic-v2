"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { buildQuickActions } from "./quickActionHelpers";
import QuickActionsGrid from "./QuickActionsGrid";
import type { QuickActionsData } from "./quickActionTypes";

interface QuickActionsCardProps {
  data: QuickActionsData;
}

export default function QuickActionsCard({
  data,
}: QuickActionsCardProps) {
  const state = buildQuickActions(data);

  return (
    <div className="space-y-8">
      <motion.section
        initial={{
          opacity: 0,
          y: -16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
          rounded-[32px]
          border
          border-white/10
          bg-white/[0.045]
          backdrop-blur-3xl
          p-8
        "
      >
        <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3 text-cyan-300">
              <Sparkles size={22} />

              <span className="text-sm font-semibold uppercase tracking-[0.25em]">
                Quick Actions
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
              Command Center
            </h1>

            <p className="mt-3 max-w-3xl text-white/60 leading-relaxed">
              Launch your most-used apps, services, and
              tools with a single click.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Actions"
              value={String(state.summary.total)}
              color="text-cyan-300"
            />

            <SummaryCard
              label="Available"
              value={String(state.summary.enabled)}
              color="text-emerald-300"
            />

            <SummaryCard
              label="Notifications"
              value={String(
                state.summary.notifications
              )}
              color="text-orange-300"
            />
          </div>
        </div>
      </motion.section>

      <QuickActionsGrid
        actions={state.actions}
      />
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  color: string;
}

function SummaryCard({
  label,
  value,
  color,
}: SummaryCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        p-5
      "
    >
      <div className="text-xs uppercase tracking-[0.15em] text-white/45">
        {label}
      </div>

      <div
        className={`mt-2 text-3xl font-bold ${color}`}
      >
        {value}
      </div>
    </div>
  );
}
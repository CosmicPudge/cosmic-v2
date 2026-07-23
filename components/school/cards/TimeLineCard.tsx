"use client";

import SchoolCard from "../ui/SchoolCard";
import SchoolBadge from "../ui/SchoolBadge";

import { TimelineInsight } from "../data/intelligence/timeline";

interface TimelineCardProps {
  timeline: TimelineInsight[];
}

export default function TimelineCard({
  timeline,
}: TimelineCardProps) {
  return (
    <SchoolCard
      title="Timeline"
      subtitle="What's coming up next"
      accent="blue"
    >
      <div className="space-y-4">
        {timeline.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/55">
            Nothing scheduled.
          </div>
        ) : (
          timeline.slice(0, 6).map((item) => (
            <TimelineRow
              key={item.id}
              item={item}
            />
          ))
        )}
      </div>
    </SchoolCard>
  );
}

function TimelineRow({
  item,
}: {
  item: TimelineInsight;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
      <div
        className={`mt-1 h-3 w-3 rounded-full ${
          item.importance === "high"
            ? "bg-red-400"
            : item.importance === "medium"
            ? "bg-yellow-400"
            : "bg-sky-400"
        }`}
      />

      <div className="min-w-0 flex-1">
        <div className="text-lg font-medium text-white">
          {item.title}
        </div>

        {item.subtitle && (
          <div className="mt-1 text-sm text-white/60">
            {item.subtitle}
          </div>
        )}

        {item.warning && (
          <div className="mt-2 text-sm text-red-300">
            ⚠ {item.warning}
          </div>
        )}

        {item.preparation && (
          <div className="mt-1 text-sm text-sky-300">
            {item.preparation}
          </div>
        )}

        <div className="mt-2 text-xs text-white/45">
          {item.start.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      </div>

      <SchoolBadge color="blue">
        {item.type.toUpperCase()}
      </SchoolBadge>
    </div>
  );
}
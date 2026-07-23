"use client";

import { buildDeadlines } from "./deadlineHelpers";
import DeadlineHeader from "./DeadlineHeader";
import DeadlineTimeline from "./DeadlineTimeline";
import UrgentDeadline from "./UrgentDeadline";
import { DeadlinesData } from "./deadlineTypes";

interface DeadlinesCardProps {
  data: DeadlinesData;
}

export default function DeadlinesCard({
  data,
}: DeadlinesCardProps) {
  const deadlines = buildDeadlines(data);

  return (
    <div className="space-y-8">
      {/* Header */}

      <DeadlineHeader
        deadlines={deadlines}
      />

      {/* Highest Priority */}

      <UrgentDeadline
        deadline={deadlines.urgentDeadline}
      />

      {/* Timeline */}

      <DeadlineTimeline
        deadlines={deadlines}
      />
    </div>
  );
}
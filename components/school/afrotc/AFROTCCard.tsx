"use client";

import { buildAFROTC } from "./afrotcHelpers";
import AFROTCHeader from "./AFROTCHeader";
import EventTimeline from "./EventTimeline";
import PTCard from "./PTCard";
import ReadinessCard from "./ReadinessCard";
import UniformCard from "./UniformCard";
import type { AFROTCData } from "./afrotcTypes";

interface AFROTCCardProps {
  data: AFROTCData;
}

export default function AFROTCCard({
  data,
}: AFROTCCardProps) {
  const state = buildAFROTC(data);

  return (
    <div className="space-y-8">
      {/* Header */}

      <AFROTCHeader state={state} />

      {/* Primary Cards */}

      <div className="grid gap-8 xl:grid-cols-2">
        <UniformCard state={state} />

        <PTCard state={state} />
      </div>

      {/* Timeline */}

      <EventTimeline
        events={state.upcomingEvents}
      />

      {/* Readiness */}

      <ReadinessCard state={state} />
    </div>
  );
}
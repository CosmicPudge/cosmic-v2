"use client";

import SchoolCard from "../ui/SchoolCard";
import SchoolMetric from "../ui/SchoolMetric";
import SchoolProgress from "../ui/SchoolProgress";
import SchoolBadge from "../ui/SchoolBadge";

export default function AFROTCCard() {
  return (
    <SchoolCard
      title="AFROTC"
      subtitle="Cadet mission status"
      accent="blue"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <SchoolMetric
            label="PT Readiness"
            value="82%"
            subvalue="On Track"
          />

          <SchoolMetric
            label="Scholarship"
            value="Preparing"
            subvalue="Application"
          />
        </div>

        <SchoolProgress
          label="Cadet Readiness"
          value={82}
          color="blue"
        />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">
                Next Event
              </div>

              <div className="mt-1 text-sm text-white/60">
                Leadership Lab
              </div>
            </div>

            <SchoolBadge color="blue">
              Tomorrow
            </SchoolBadge>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/55">
            Mission
          </div>

          <p className="mt-2 text-sm leading-6 text-white/70">
            Continue preparing scholarship paperwork,
            maintain academic performance, and stay
            physically ready for PT.
          </p>
        </div>
      </div>
    </SchoolCard>
  );
}
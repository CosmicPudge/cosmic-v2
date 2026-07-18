"use client";

export interface SemesterData {
  name: string;
  week: number;
  progress: number;
}

interface SemesterProgressProps {
  semester: SemesterData;
}

function getSemesterStage(progress: number) {
  if (progress < 15)
    return {
      label: "Early Semester",
      color: "text-emerald-300",
    };

  if (progress < 40)
    return {
      label: "Building Momentum",
      color: "text-sky-300",
    };

  if (progress < 65)
    return {
      label: "Midterms",
      color: "text-yellow-300",
    };

  if (progress < 90)
    return {
      label: "Final Stretch",
      color: "text-orange-300",
    };

  return {
    label: "Finals",
    color: "text-red-300",
  };
}

export default function SemesterProgress({
  semester,
}: SemesterProgressProps) {
  const stage = getSemesterStage(semester.progress);

  return (
    <div
      className="
        w-80
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        p-6
      "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/50">
            Semester
          </p>

          <h3 className="mt-2 text-2xl font-semibold text-white">
            {semester.name}
          </h3>

          <p className="mt-1 text-white/60">
            Week {semester.week}
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-white">
            {semester.progress}%
          </p>

          <p className={`mt-1 text-sm font-medium ${stage.color}`}>
            {stage.label}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-violet-500
              via-sky-400
              to-cyan-300
              transition-all
              duration-700
            "
            style={{
              width: `${semester.progress}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-between text-sm text-white/50">
        <span>Start</span>
        <span>Midterms</span>
        <span>Finals</span>
      </div>
    </div>
  );
}
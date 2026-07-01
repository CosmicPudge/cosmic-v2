"use client";

interface ScoreRowProps {
  logo?: React.ReactNode;

  abbreviation: string;

  name?: string;

  record?: string;

  score?: number | null;

  highlighted?: boolean;
}

export default function ScoreRow({
  logo,
  abbreviation,
  name,
  record,
  score,
  highlighted = false,
}: ScoreRowProps) {
  return (
    <div
      className={`
        flex items-center justify-between
        rounded-2xl
        px-4
        py-4
        transition-all
        ${
          highlighted
            ? "bg-white/10"
            : "bg-transparent"
        }
      `}
    >
      <div className="flex items-center gap-4">

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">

          {logo ?? (
            <span className="text-lg font-bold">
              {abbreviation.charAt(0)}
            </span>
          )}

        </div>

        <div>

          <h3 className="text-2xl font-bold">
            {abbreviation}
          </h3>

          {record && (
            <p className="text-sm text-white/45">
              {record}
            </p>
          )}

          {name && (
            <p className="text-sm text-white/55">
              {name}
            </p>
          )}

        </div>

      </div>

      {score !== undefined && score !== null && (

        <div className="text-6xl font-black tabular-nums">

          {score}

        </div>

      )}
    </div>
  );
}
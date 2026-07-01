"use client";

interface MatchupBarProps {
  batter: string;
  pitcher: string;
  pitchCount: number;
}

export default function MatchupBar({
  batter,
  pitcher,
  pitchCount,
}: MatchupBarProps) {
  return (
    <div className="mt-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-8 py-6">

      <div>
        <p className="text-xs uppercase tracking-wider text-white/40">
          At Bat
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          {batter}
        </h2>
      </div>

      <div className="text-center text-white/40 text-xl">
        vs
      </div>

      <div className="text-right">
        <p className="text-xs uppercase tracking-wider text-white/40">
          Pitching
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          {pitcher}
        </h2>

        <p className="text-sm text-white/50">
          {pitchCount} pitches
        </p>
      </div>

    </div>
  );
}
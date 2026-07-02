"use client";

import HeroPanel from "@/components/os/ui/HeroPanel";
import StatusBadge from "@/components/os/ui/StatusBadge";
import LiveScoreboard from "./LiveScoreboard";

import { SportsData } from "@/services/sportsService";

interface Props {
  sports: SportsData;
}

export default function FinalHero({
  sports,
}: Props) {
  const game = sports.lastGame;

  if (!game) return null;

  return (
    <HeroPanel
      eyebrow={`LOS ANGELES ANGELS • ${game.awayRecord}`}
      title="Final"
      subtitle="Game Complete"
      status={
        <StatusBadge
          label="FINAL"
          color="blue"
        />
      }
    >
      <LiveScoreboard
        awayAbbr={game.awayAbbr}
        homeAbbr={game.homeAbbr}
        awayScore={game.awayScore}
        homeScore={game.homeScore}
        awayRecord={game.awayRecord}
        homeRecord={game.homeRecord}
      />

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm uppercase tracking-wider text-white/40">
          Final Score
        </p>

        <p className="mt-3 text-lg text-white/70">
          Thanks for watching.
        </p>
      </div>
    </HeroPanel>
  );
}
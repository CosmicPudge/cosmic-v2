"use client";

import { SportsData } from "@/services/sportsService";
import StatusBadge from "@/components/os/ui/StatusBadge";
import BaseDiamond from "./BaseDiamond";

interface GameHeroProps {
  sports: SportsData;
}

export default function GameHero({
  sports,
}: GameHeroProps) {
  if (!sports.nextGame && !sports.lastGame) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-2xl font-bold">
          No Games Scheduled
        </h2>
      </div>
    );
  }

  const game = sports.nextGame;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            LOS ANGELES ANGELS
          </p>

          <h1 className="mt-4 text-6xl font-bold">
            {game?.awayAbbr} @ {game?.homeAbbr}
          </h1>

          <p className="mt-3 text-xl text-white/70">
            {new Date(game!.gameDate).toLocaleString([], {
              weekday: "long",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>

        </div>

        <div className="text-right">

          <StatusBadge
            label={sports.gameState}
            color={
              sports.live
                ? "green"
                : sports.pregame
                ? "yellow"
                : "blue"
            }
          />

          <p className="mt-3 text-sm text-white/50">
            {game?.status}
          </p>

        </div>

      </div>

      {/* LIVE GAME */}

      {sports.live && game?.liveDetails && (

        <div className="mt-10">

          <div className="grid grid-cols-2 gap-6">

            <div className="rounded-xl bg-white/5 p-6 text-center">

              <p className="text-sm text-white/50">
                {game.awayAbbr}
              </p>

              <h2 className="mt-2 text-5xl font-bold">
                {game.awayScore}
              </h2>

            </div>

            <div className="rounded-xl bg-white/5 p-6 text-center">

              <p className="text-sm text-white/50">
                {game.homeAbbr}
              </p>

              <h2 className="mt-2 text-5xl font-bold">
                {game.homeScore}
              </h2>

            </div>

          </div>

          <div className="mt-8">

            <BaseDiamond
              first={game.liveDetails.firstBase ?? false}
              second={game.liveDetails.secondBase ?? false}
              third={game.liveDetails.thirdBase ?? false}
            />

          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">

            <div className="rounded-xl bg-white/5 p-4 text-center">

              <p className="text-sm text-white/50">
                Count
              </p>

              <p className="text-2xl font-bold">
                {game.liveDetails.balls}-{game.liveDetails.strikes}
              </p>

            </div>

            <div className="rounded-xl bg-white/5 p-4 text-center">

              <p className="text-sm text-white/50">
                Outs
              </p>

              <p className="text-2xl font-bold">
                {game.liveDetails.outs}
              </p>

            </div>

            <div className="rounded-xl bg-white/5 p-4 text-center">

              <p className="text-sm text-white/50">
                Inning
              </p>

              <p className="text-2xl font-bold">
                {game.liveDetails.inningHalf}{" "}
                {game.liveDetails.inning}
              </p>

            </div>

          </div>

        </div>

      )}

      {/* PREGAME */}

      {!sports.live && game && (

        <div className="mt-10 grid grid-cols-3 gap-4">

          <div className="rounded-xl bg-white/5 p-5 text-center">

            <p className="text-sm text-white/50">
              Away
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              {game.awayAbbr}
            </h2>

          </div>

          <div className="rounded-xl bg-white/5 p-5 text-center">

            <p className="text-sm text-white/50">
              Home
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              {game.homeAbbr}
            </h2>

          </div>

          <div className="rounded-xl bg-white/5 p-5 text-center">

            <p className="text-sm text-white/50">
              Venue
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {game.isHome ? "Angel Stadium" : "Away Game"}
            </h2>

          </div>

        </div>

      )}

    </div>
  );
}
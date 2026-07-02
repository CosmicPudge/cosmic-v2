"use client";

import HeroPanel from "@/components/os/ui/HeroPanel";
import StatusBadge from "@/components/os/ui/StatusBadge";
import TeamLogo from "./TeamLogo";

import { SportsData } from "@/services/sportsService";

interface Props {
    sports: SportsData;
}

export default function PregameHero({
    sports,
}: Props) {
    const game = sports.nextGame;

    if (!game) return null;

    return (
        <HeroPanel
            eyebrow={`LOS ANGELES ANGELS • ${sports.lastGame?.awayRecord ?? "--"
                }`}
            title="Next Game"
            subtitle={new Date(game.gameDate).toLocaleString([], {
                weekday: "long",
                hour: "numeric",
                minute: "2-digit",
            })}
            status={
                <StatusBadge
                    label="PREVIEW"
                    color="yellow"
                />
            }
        >
            <div className="mt-12 flex flex-col items-center">

                <TeamLogo
                    league="mlb"
                    team={game.awayAbbr}
                    size={96}
                />

                <h2 className="mt-5 text-6xl font-black tracking-tight">
                    {game.awayAbbr}
                </h2>

                <p className="my-6 text-3xl font-light text-white/25">
                    @
                </p>

                <TeamLogo
                    league="mlb"
                    team={game.homeAbbr}
                    size={96}
                />

                <h2 className="mt-5 text-6xl font-black tracking-tight">
                    {game.homeAbbr}
                </h2>

                <p className="mt-8 text-xl text-white/60">
                    {new Date(game.gameDate).toLocaleString([], {
                        weekday: "long",
                        hour: "numeric",
                        minute: "2-digit",
                    })}
                </p>

            </div>

            <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div className="flex justify-between text-sm text-white/60">

                <div>

                    <p>Last Game</p>

                    <p className="mt-1 text-white">
                        {sports.lastGame
                            ? `${sports.lastGame.awayAbbr} ${sports.lastGame.awayScore}–${sports.lastGame.homeScore} ${sports.lastGame.homeAbbr}`
                            : "--"}
                    </p>

                </div>

                <div className="text-right">

                    <p>First Pitch</p>

                    <p className="mt-1 text-white">
                        {new Date(game.gameDate).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                        })}
                    </p>

                </div>

            </div>

        </HeroPanel>
    );
}
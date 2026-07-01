"use client";

import HeroPanel from "@/components/os/ui/HeroPanel";
import StatusBadge from "@/components/os/ui/StatusBadge";
import LiveScoreboard from "./LiveScoreboard";
import Scoreboard from "./Scoreboard";
import BaseDiamond from "./BaseDiamond";
import GameSituation from "./GameSituation";
import MatchupBar from "./MatchupBar";
import PlayTicker from "./PlayTicker";



import { SportsData } from "@/services/sportsService";

interface Props {
    sports: SportsData;
}

export default function LiveHero({
    sports,
}: Props) {
    const game = sports.nextGame;

    if (!game || !game.liveDetails) return null;

    return (
        <HeroPanel
            eyebrow="LOS ANGELES ANGELS • 36-50"
            title={`${game.liveDetails.inningHalf} ${game.liveDetails.inning}`}
            subtitle={`${game.liveDetails.outs} Out${game.liveDetails.outs === 1 ? "" : "s"
                }`}
            status={
                <StatusBadge
                    label="LIVE"
                    color="green"
                />
            }
        >
            <LiveScoreboard
                awayAbbr={game.awayAbbr}
                homeAbbr={game.homeAbbr}
                awayScore={game.awayScore}
                homeScore={game.homeScore}
                awayRecord={sports.lastGame?.awayRecord}
                homeRecord={sports.lastGame?.homeRecord}
            />

            <GameSituation
                inning={game.liveDetails.inning ?? 0}
                inningHalf={game.liveDetails.inningHalf ?? ""}
                outs={game.liveDetails.outs ?? 0}
                balls={game.liveDetails.balls ?? 0}
                strikes={game.liveDetails.strikes ?? 0}
                first={game.liveDetails.firstBase ?? false}
                second={game.liveDetails.secondBase ?? false}
                third={game.liveDetails.thirdBase ?? false}
            />

            <div className="my-8 h-px bg-white/10" />

            <MatchupBar
                batter={game.liveDetails.batter ?? ""}
                pitcher={game.liveDetails.pitcher ?? ""}
                pitchCount={game.liveDetails.pitcherPitchCount ?? 0}
            />

            <PlayTicker
                play={game.liveDetails.playDescription ?? ""}
            />
        </HeroPanel>
    );
}
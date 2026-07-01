"use client";

import TeamLogo from "./TeamLogo";

interface LiveScoreboardProps {
    awayAbbr: string;
    homeAbbr: string;

    awayScore: number | null;
    homeScore: number | null;

    awayRecord?: string;
    homeRecord?: string;
}

export default function LiveScoreboard({
    awayAbbr,
    homeAbbr,
    awayScore,
    homeScore,
    awayRecord,
    homeRecord,
}: LiveScoreboardProps) {
    return (
        <div className="flex flex-col gap-8">

            <div className="flex items-center justify-between">

                <div className="flex items-center gap-5">

                    <TeamLogo
                        league="mlb"
                        team={awayAbbr}
                        size={56}
                    />

                    <div>
                        <h2 className="text-4xl font-bold">
                            {awayAbbr}
                        </h2>

                        {awayRecord && (
                            <p className="text-white/45">
                                {awayRecord}
                            </p>
                        )}
                    </div>

                </div>

                <h1 className="text-8xl md:text-9xl font-black tabular-nums">
                    {awayScore ?? "-"}
                </h1>

            </div>

            <div className="h-[2px] bg-white/15" />

            <div className="flex items-center justify-between">

                <div className="flex items-center gap-5">

                    <TeamLogo
                        league="mlb"
                        team={homeAbbr}
                        size={56}
                    />

                    <div>
                        <h2 className="text-4xl font-bold">
                            {homeAbbr}
                        </h2>

                        {homeRecord && (
                            <p className="text-white/45">
                                {homeRecord}
                            </p>
                        )}
                    </div>

                </div>

                <h1 className="text-8xl md:text-9xl font-black tabular-nums">
                    {homeScore ?? "-"}
                </h1>

            </div>

        </div>
    );
}

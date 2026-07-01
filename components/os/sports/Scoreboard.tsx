"use client";

import ScoreRow from "./ScoreRow";

interface TeamData {
  logo?: React.ReactNode;

  abbreviation: string;

  name?: string;

  record?: string;

  score?: number | null;

  highlighted?: boolean;
}

interface ScoreboardProps {
  away: TeamData;
  home: TeamData;
}

export default function Scoreboard({
  away,
  home,
}: ScoreboardProps) {
  return (
    <div className="space-y-2">

      <ScoreRow
        logo={away.logo}
        abbreviation={away.abbreviation}
        name={away.name}
        record={away.record}
        score={away.score}
        highlighted={away.highlighted}
      />

      <ScoreRow
        logo={home.logo}
        abbreviation={home.abbreviation}
        name={home.name}
        record={home.record}
        score={home.score}
        highlighted={home.highlighted}
      />

    </div>
  );
}
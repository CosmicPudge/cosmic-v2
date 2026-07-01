"use client";

import BaseDiamond from "./BaseDiamond";

interface Props {
  inning: number;
  inningHalf: string;

  outs: number;

  balls: number;
  strikes: number;

  first: boolean;
  second: boolean;
  third: boolean;
}

export default function GameSituation({
  inning,
  inningHalf,
  outs,
  balls,
  strikes,
  first,
  second,
  third,
}: Props) {
  return (
    <div className="mt-10 flex flex-col items-center">

      <h2 className="text-3xl font-bold">
        {inningHalf} {inning}
      </h2>

      <p className="mt-1 text-white/50">
        {outs} Out{outs !== 1 && "s"}
      </p>

      <div className="my-8">
        <BaseDiamond
          first={first}
          second={second}
          third={third}
        />
      </div>

      <p className="text-lg text-white/70">
        Count {balls}-{strikes}
      </p>

    </div>
  );
}
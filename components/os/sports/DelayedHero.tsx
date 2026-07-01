"use client";

import { SportsData } from "@/services/sportsService";

interface Props {
  sports: SportsData;
}

export default function DelayedHero({
  sports,
}: Props) {
  return (
    <div className="text-center p-10">
      Game Delayed
    </div>
  );
}
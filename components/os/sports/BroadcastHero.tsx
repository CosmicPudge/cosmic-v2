"use client";

import { SportsData } from "@/services/sportsService";

import PregameHero from "./PregameHero";
import LiveHero from "./LiveHero";
import FinalHero from "./FinalHero";
import DelayedHero from "./DelayedHero";
import PostponedHero from "./PostponedHero";

interface BroadcastHeroProps {
  sports: SportsData;
}

export default function BroadcastHero({
  sports,
}: BroadcastHeroProps) {
  switch (sports.state) {
    case "pregame":
      return <PregameHero sports={sports} />;

    case "live":
      return <LiveHero sports={sports} />;

    case "final":
      return <FinalHero sports={sports} />;

    case "delayed":
      return <DelayedHero sports={sports} />;

    case "postponed":
      return <PostponedHero sports={sports} />;

    default:
      return <PregameHero sports={sports} />;
  }
}
"use client";

import { useEffect, useState } from "react";
import BroadcastHero from "@/components/os/sports/BroadcastHero";

import AppWindow from "./AppWindow";

import {
  getSports,
  SportsData,
} from "@/services/sportsService";

import StatCard from "@/components/os/ui/StatCard";
import SectionCard from "@/components/os/ui/SectionCard";
import InfoRow from "@/components/os/ui/InfoRow";
import StatusBadge from "@/components/os/ui/StatusBadge";
import Skeleton from "@/components/os/ui/Skeleton";

export default function SportsWindow() {
  const [sports, setSports] =
    useState<SportsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadSports() {
  try {
    const data = await getSports();

    setSports(data);

    if (interval) clearInterval(interval);

    const refreshRate =
      data.state === "live"
        ? 10000
        : data.state === "pregame"
        ? 60000
        : 300000;

    interval = setInterval(loadSports, refreshRate);

  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}

    loadSports();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <AppWindow
        title="Sports"
        windowName="sports"
      >
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </AppWindow>
    );
  }

  if (!sports) {
    return (
      <AppWindow
        title="Sports"
        windowName="sports"
      >
        Unable to load sports.
      </AppWindow>
    );
  }

  return (
    <AppWindow
      title="Sports"
      windowName="sports"
    >
      <div className="space-y-6">

        <BroadcastHero sports={sports} />

        {sports.nextGame && (

          <SectionCard title="Next Game">

            <InfoRow
              label="Opponent"
              value={sports.nextGame.opponent}
            />

            <InfoRow
              label="Status"
              value={sports.nextGame.status}
            />

            <InfoRow
              label="Home / Away"
              value={
                sports.nextGame.isHome
                  ? "Home"
                  : "Away"
              }
            />

          </SectionCard>

        )}

        {sports.lastGame && (

          <SectionCard title="Last Game">

            <div className="grid grid-cols-2 gap-4">

              <StatCard
                title={sports.lastGame.awayAbbr}
                value={`${sports.lastGame.awayScore}`}
              />

              <StatCard
                title={sports.lastGame.homeAbbr}
                value={`${sports.lastGame.homeScore}`}
              />

            </div>

          </SectionCard>

        )}

      </div>

    </AppWindow>
  );
}
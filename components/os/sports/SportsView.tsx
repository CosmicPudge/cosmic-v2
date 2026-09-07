"use client";

import { useCallback, useState } from "react";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";

import BroadcastHero from "@/components/apps/sports/BroadcastHero";

import {
  getSports,
  SportsData,
} from "@/services/sportsService";

import StatCard from "@/components/os/ui/StatCard";
import SectionCard from "@/components/os/ui/SectionCard";
import InfoRow from "@/components/os/ui/InfoRow";
import Skeleton from "@/components/os/ui/Skeleton";

export default function SportsView() {
  const [sports, setSports] =
    useState<SportsData | null>(null);

  const [loading, setLoading] =
    useState(true);
  const [refreshRate, setRefreshRate] = useState(300000);

  const loadSports = useCallback(async () => {
      try {
        const data = await getSports();

        setSports(data);
        setRefreshRate(
          data.state === "live"
            ? 10000
            : data.state === "pregame"
            ? 60000
            : 300000
        );

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
  }, []);

  useVisiblePolling(loadSports, refreshRate, { immediate: true });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  if (!sports) {
    return <>Unable to load sports.</>;
  }

  return (
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
  );
}

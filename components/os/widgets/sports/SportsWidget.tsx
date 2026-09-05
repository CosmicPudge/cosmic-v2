"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { WidgetEmpty, WidgetError, WidgetLoading } from "@/components/os/ui/widget";
import { useSports } from "@/hooks/os/useSports";
import { prioritizeFollowedEvents } from "@/services/sports/preferences";
import { useSettingsRepository } from "@/services/settings/localRepository";
import { useDashboardWidgetReadiness } from "@/components/dashboard/readiness/DashboardReadiness";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";

import SportsCurrent from "./SportsCurrent";
import SportsScores from "./SportsScores";
import SportsStandings from "./SportsStandings";
import SportsFooter from "./SportsFooter";
import { dashboardImage } from "@/components/dashboard/images/dashboardImageManifest";

export default function SportsWidget() {
  const { size, presentation } = useWidgetContext();
  const { data, loading, error } = useSports();
  const { data: settings } = useSettingsRepository();
  const liveOrFeatured = data ? prioritizeFollowedEvents(data.live, settings.preferences)[0] ?? prioritizeFollowedEvents(data.featured, settings.preferences)[0] : undefined;
  const sportsImage = liveOrFeatured?.sport.toLowerCase().includes("mlb") || liveOrFeatured?.sport.toLowerCase().includes("baseball") ? dashboardImage("sports-mlb") : liveOrFeatured?.sport.toLowerCase().includes("f1") || liveOrFeatured?.sport.toLowerCase().includes("formula") ? dashboardImage("sports-f1") : dashboardImage("sports");
  const upcoming = data ? prioritizeFollowedEvents(data.upcoming, settings.preferences) : [];
  const standings = data ? Object.values(data.standings).flat() : [];
  useDashboardWidgetReadiness("sports", loading && !data ? "loading" : error && !data ? "degraded" : "ready");
  if (presentation === "kiosk") return <KioskSceneFrame scene="sports" eyebrow="COSMIC • SPORTS" title={liveOrFeatured?.title ?? (loading ? "Scanning events." : "No live event.")} subtitle={liveOrFeatured ? `${liveOrFeatured.statusDetail ?? liveOrFeatured.status} · ${liveOrFeatured.sport.toUpperCase()}` : "Upcoming games will appear here."} />;

  return (
    <Widget
      accent="sports"
      imageUrl={sportsImage.src}
      imagePosition={sportsImage.objectPosition}
      imageOpacity={.8}
      imageBlur={0}
    >
      <WidgetHeader
        title="Sports"
        subtitle="Live scores & favorite teams"
      />

      <WidgetBody scrollable={size === "large"}>
        {loading && !data ? <WidgetLoading label="Loading sports" compact /> : error && !data ? <WidgetError title="Sports unavailable" message={error} compact /> : !data ? <WidgetEmpty title="No sports data" description="Scores and schedules will appear here." compact /> : <>
          <SportsCurrent event={liveOrFeatured} />
          {size !== "small" && <SportsScores events={upcoming.slice(0, size === "medium" ? 2 : 3)} />}
          {size === "large" && <SportsStandings standings={standings} />}
        </>}
      </WidgetBody>

      <WidgetFooter>
        <SportsFooter partial={Boolean(data?.providerErrors.length)} updatedAt={data?.lastUpdated} />
      </WidgetFooter>
    </Widget>
  );
}

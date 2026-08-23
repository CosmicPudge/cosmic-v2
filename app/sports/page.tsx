import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

import SportsView from "@/components/apps/sports/SportsView";
import AdSlot from "@/components/ads/AdSlot";

export default function SportsPage() {
  return (
    <AppShell app="sports">

      <AppHeader
        title="Sports"
        subtitle="Live scores, schedules, standings, and favorite teams"
      />

      <AppContent>

        <SportsView />
        <AdSlot placementId="sports.home.inline" />

      </AppContent>

    </AppShell>
  );
}

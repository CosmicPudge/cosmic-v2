import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import GarageView from "@/components/apps/garage/GarageView";
import AdSlot from "@/components/ads/AdSlot";

export default function GaragePage() {
  return (
    <AppShell app="garage">
      <AppHeader
        title="Garage"
        subtitle="Garage application"
      />

      <AppContent>
        <GarageView />
        <AdSlot placementId="garage.overview.inline" />
      </AppContent>
    </AppShell>
  );
}

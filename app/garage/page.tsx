import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import GarageView from "@/components/apps/garage/GarageView";

export default function GaragePage() {
  return (
    <AppShell app="garage">
      <AppHeader
        title="Garage"
        subtitle="Garage application"
      />

      <AppContent>
        <GarageView />
      </AppContent>
    </AppShell>
  );
}

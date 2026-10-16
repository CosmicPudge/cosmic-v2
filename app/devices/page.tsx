import AppShell from "@/components/os/app/AppShell";
import AppContent from "@/components/os/app/AppContent";
import DeviceControlOverview from "@/components/apps/devices/DeviceControlOverview";

export default function DevicesPage() {
  return (
    <AppShell app="system">
      <AppContent>
        <DeviceControlOverview />
      </AppContent>
    </AppShell>
  );
}

import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

export default function DevicesPage() {
  return (
    <AppShell app="system">
      <AppHeader title="Devices" subtitle="Kiosk, displays, connected devices, and control." />
      <AppContent><p className="text-sm text-white/55">Devices is ready for its page milestone.</p></AppContent>
    </AppShell>
  );
}

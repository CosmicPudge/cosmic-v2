import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import CalendarView from "@/components/apps/calendar/CalendarView";
import AdSlot from "@/components/ads/AdSlot";

export default function CalendarPage() {
  return (
    <AppShell>
      <AppHeader
        title="Calendar"
        subtitle="Your schedule and upcoming events"
      />

      <AppContent>
        <CalendarView />
        <AdSlot placementId="calendar.overview.peripheral" />
      </AppContent>
    </AppShell>
  );
}

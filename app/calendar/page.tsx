import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

export default function CalendarPage() {
  return (
    <AppShell>
      <AppHeader
        title="Calendar"
        subtitle="Calendar application"
      />

      <AppContent>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Calendar</h2>

          <p className="text-white/60">
            Calendar is currently under development.
          </p>
        </div>
      </AppContent>
    </AppShell>
  );
}

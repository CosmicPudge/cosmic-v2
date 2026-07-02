import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

export default function GaragePage() {
  return (
    <AppShell app="garage">
      <AppHeader
        title="Garage"
        subtitle="Garage application"
      />

      <AppContent>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Garage</h2>

          <p className="text-white/60">
            Garage is currently under development.
          </p>
        </div>
      </AppContent>
    </AppShell>
  );
}

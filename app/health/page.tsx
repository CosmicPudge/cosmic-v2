import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

export default function HealthPage() {
  return (
    <AppShell>
      <AppHeader title="Health" subtitle="Fitness, recovery, nutrition, and personal wellness." />
      <AppContent><p className="text-sm text-white/55">Health is ready for its page milestone.</p></AppContent>
    </AppShell>
  );
}

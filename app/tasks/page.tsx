import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

export default function TasksPage() {
  return (
    <AppShell>
      <AppHeader title="Tasks" subtitle="Turn plans into progress." />
      <AppContent><p className="text-sm text-white/55">Tasks is ready for its page milestone.</p></AppContent>
    </AppShell>
  );
}

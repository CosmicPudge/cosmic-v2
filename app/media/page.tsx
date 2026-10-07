import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

export default function MediaPage() {
  return (
    <AppShell app="music">
      <AppHeader title="Media" subtitle="Music, shows, entertainment, and playback." />
      <AppContent><p className="text-sm text-white/55">Media is ready for its page milestone.</p></AppContent>
    </AppShell>
  );
}

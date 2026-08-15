import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import MusicView from "@/components/apps/music/MusicView";

export default function MusicPage() {
  return (
    <AppShell>
      <AppHeader
        title="Music"
        subtitle="Music application"
      />

      <AppContent>
        <MusicView />
      </AppContent>
    </AppShell>
  );
}

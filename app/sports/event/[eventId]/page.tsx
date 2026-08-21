import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import LiveEventCenter from "@/components/apps/sports/event/LiveEventCenter";

export default async function SportsEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <AppShell><AppHeader title="Sports Event Center" subtitle="Detailed provider-backed event state" /><AppContent><LiveEventCenter eventId={decodeURIComponent(eventId)} /></AppContent></AppShell>;
}

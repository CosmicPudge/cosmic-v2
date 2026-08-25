import AppShell from "@/components/os/app/AppShell";
import SportsView from "@/components/apps/sports/SportsView";
import AdSlot from "@/components/ads/AdSlot";

export default function SportsPage() {
  return <AppShell app="sports"><SportsView /><div className="mx-auto mt-6 max-w-[1500px]"><AdSlot placementId="sports.home.inline" /></div></AppShell>;
}

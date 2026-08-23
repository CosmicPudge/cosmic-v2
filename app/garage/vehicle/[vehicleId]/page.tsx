import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import GarageVehiclePage from "@/components/apps/garage/GarageVehiclePage";

export default async function GarageVehicleRoute({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = await params;
  return <AppShell app="garage"><AppHeader title="Vehicle" subtitle="Garage vehicle details" /><AppContent><GarageVehiclePage vehicleId={vehicleId} /></AppContent></AppShell>;
}

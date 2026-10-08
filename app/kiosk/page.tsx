import { Suspense } from "react";
import StandaloneDesktopKiosk from "@/components/os/kiosk/StandaloneDesktopKiosk";
import CosmosKioskLoadingScreen from "@/components/os/kiosk/CosmosKioskLoadingScreen";

export default function KioskPage() {
  return (
    <Suspense fallback={<CosmosKioskLoadingScreen />}>
      <StandaloneDesktopKiosk />
    </Suspense>
  );
}

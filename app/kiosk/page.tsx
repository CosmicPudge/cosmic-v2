import { Suspense } from "react";
import StandaloneDesktopKiosk from "@/components/os/kiosk/StandaloneDesktopKiosk";

export default function KioskPage() {
  return (
    <Suspense fallback={<main className="fixed inset-0 bg-[#02040e]" aria-busy="true" />}>
      <StandaloneDesktopKiosk />
    </Suspense>
  );
}

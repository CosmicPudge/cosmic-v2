import KioskShell from "@/components/os/kiosk/KioskShell";
import KioskSlideshow from "@/components/os/kiosk/KioskSlideshow";

export default function KioskPage() {
  return (
    <KioskShell>
      <KioskSlideshow />
    </KioskShell>
  );
}
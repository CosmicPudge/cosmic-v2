import KioskShell from "@/components/os/kiosk/KioskShell";
import KioskAuthGate from "@/components/os/kiosk/KioskAuthGate";

export default function KioskPage() {
  return (
    <KioskShell>
      <KioskAuthGate />
    </KioskShell>
  );
}

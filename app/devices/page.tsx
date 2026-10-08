import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import ConnectedDevices from "@/components/account/ConnectedDevices";

export default function DevicesPage() {
  return (
    <AppShell app="system">
      <AppHeader title="Devices" subtitle="Kiosk displays, slide rotation, connected devices, and control." />
      <AppContent>
        <div className="space-y-5">
          <section className="rounded-2xl border border-violet-300/15 bg-violet-400/[0.05] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200/60">Cosmos Kiosk</p>
            <h2 className="mt-2 text-2xl font-semibold">Two-minute ambient rotation</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">Each connected kiosk starts with Clock, rotates through the enabled personal scenes every two minutes, and ends on System before beginning again. Use the controls below to turn individual scenes on or off per display.</p>
          </section>
          <ConnectedDevices />
        </div>
      </AppContent>
    </AppShell>
  );
}

import type { Metadata } from "next";

import ClockView from "@/components/apps/clock/ClockView";
import AppContent from "@/components/os/app/AppContent";
import AppHeader from "@/components/os/app/AppHeader";
import AppShell from "@/components/os/app/AppShell";

export const metadata: Metadata = {
  title: "Clock",
  description: "World clocks, alarms, timers, and stopwatch for Cosmic OS.",
};

export default function ClockPage() {
  return (
    <AppShell>
      <AppHeader title="Clock" subtitle="Local time, anywhere time, and focused timing." />
      <AppContent>
        <ClockView />
      </AppContent>
    </AppShell>
  );
}

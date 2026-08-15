import type { Metadata } from "next";

import SettingsView from "@/components/apps/settings/SettingsView";
import AppShell from "@/components/os/app/AppShell";

export const metadata: Metadata = {
  title: "Settings",
  description: "Cosmic preferences, connections, and local data controls.",
};

export default function SettingsPage() {
  return <AppShell><SettingsView /></AppShell>;
}

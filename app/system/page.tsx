import type { Metadata } from "next";

import SystemView from "@/components/apps/system/SystemView";
import AppShell from "@/components/os/app/AppShell";

export const metadata: Metadata = {
  title: "System",
  description: "Cosmic browser, device, display, storage, network, and install capabilities.",
};

export default function SystemPage() {
  return <AppShell><SystemView /></AppShell>;
}

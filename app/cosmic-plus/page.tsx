import type { Metadata } from "next";
import AppShell from "@/components/os/app/AppShell";
import CosmicPlusPage from "@/components/cosmic-plus/CosmicPlusPage";

export const metadata: Metadata = { title: "Cosmic+", description: "Cosmic+ product capabilities and current plan." };

export default function CosmicPlusRoute() { return <AppShell><CosmicPlusPage /></AppShell>; }

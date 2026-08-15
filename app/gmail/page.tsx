import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import GmailView from "@/components/apps/gmail/GmailView";

export default function GmailPage() {
  return <AppShell><AppHeader title="Gmail" subtitle="Powered by Cosmic Mail" /><AppContent><GmailView /></AppContent></AppShell>;
}

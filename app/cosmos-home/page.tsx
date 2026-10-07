import AppShell from "@/components/os/app/AppShell";
import AppContent from "@/components/os/app/AppContent";
import CosmosHome from "@/components/home/CosmosHome";

export default function CosmosHomePreviewPage() {
  return (
    <AppShell>
      <AppContent>
        <CosmosHome />
      </AppContent>
    </AppShell>
  );
}

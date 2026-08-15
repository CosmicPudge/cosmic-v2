import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import NotesView from "@/components/apps/notes/NotesView";

export default function NotesPage() {
  return (
    <AppShell>
      <AppHeader
        title="Notes"
        subtitle="Notes application"
      />

      <AppContent>
        <NotesView />
      </AppContent>
    </AppShell>
  );
}

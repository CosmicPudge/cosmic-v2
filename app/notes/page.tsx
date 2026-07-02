import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

export default function NotesPage() {
  return (
    <AppShell>
      <AppHeader
        title="Notes"
        subtitle="Notes application"
      />

      <AppContent>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Notes</h2>

          <p className="text-white/60">
            Notes is currently under development.
          </p>
        </div>
      </AppContent>
    </AppShell>
  );
}

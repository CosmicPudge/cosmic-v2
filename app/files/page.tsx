import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

export default function FilesPage() {
  return (
    <AppShell>
      <AppHeader
        title="Files"
        subtitle="Files application"
      />

      <AppContent>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Files</h2>

          <p className="text-white/60">
            Files is currently under development.
          </p>
        </div>
      </AppContent>
    </AppShell>
  );
}

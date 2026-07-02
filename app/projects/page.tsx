import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";

export default function ProjectsPage() {
  return (
    <AppShell>
      <AppHeader
        title="Projects"
        subtitle="Projects application"
      />

      <AppContent>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Projects</h2>

          <p className="text-white/60">
            Projects is currently under development.
          </p>
        </div>
      </AppContent>
    </AppShell>
  );
}

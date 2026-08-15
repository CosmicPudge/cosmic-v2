import AppShell from "@/components/os/app/AppShell";
import AppHeader from "@/components/os/app/AppHeader";
import AppContent from "@/components/os/app/AppContent";
import ProjectsView from "@/components/apps/projects/ProjectsView";

export default function ProjectsPage() {
  return (
    <AppShell>
      <AppHeader
        title="Projects"
        subtitle="Projects application"
      />

      <AppContent>
        <ProjectsView />
      </AppContent>
    </AppShell>
  );
}

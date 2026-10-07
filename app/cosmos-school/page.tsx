import AppShell from "@/components/os/app/AppShell";
import AppContent from "@/components/os/app/AppContent";
import CosmosSchoolOverview from "@/components/school/CosmosSchoolOverview";
import { SchoolDataProvider } from "@/components/school/context/SchoolDataContext";
import { SchoolEnvironment } from "@/components/school/SchoolEnvironment";

export default function CosmosSchoolPreviewPage() {
  return (
    <SchoolEnvironment>
      <SchoolDataProvider>
        <AppShell app="school">
          <AppContent>
            <CosmosSchoolOverview preview />
          </AppContent>
        </AppShell>
      </SchoolDataProvider>
    </SchoolEnvironment>
  );
}

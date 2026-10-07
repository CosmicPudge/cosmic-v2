import type { ReactNode } from "react";
import AppShell from "@/components/os/app/AppShell";
import { SchoolEnvironment } from "../SchoolEnvironment";

interface SchoolLayoutProps {
  children: ReactNode;
}

export function SchoolLayout({ children }: SchoolLayoutProps) {
  return (
    <SchoolEnvironment>
      <AppShell app="school">
        <div className="school-page-enter mx-auto max-w-7xl motion-reduce:animate-none">
          {children}
        </div>
      </AppShell>
    </SchoolEnvironment>
  );
}

export default SchoolLayout;

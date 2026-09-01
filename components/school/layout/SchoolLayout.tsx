import type { ReactNode } from "react";
import { SchoolSidebar } from "./SchoolSidebar";
import { SchoolEnvironment } from "../SchoolEnvironment";

interface SchoolLayoutProps {
  children: ReactNode;
}

export function SchoolLayout({ children }: SchoolLayoutProps) {
  return <SchoolEnvironment><main className="relative min-h-screen overflow-hidden text-white">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1800px] flex-col lg:flex-row">
        <SchoolSidebar />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
          <div className="school-page-enter mx-auto max-w-7xl motion-reduce:animate-none">{children}</div>
        </div>
      </div>
    </main></SchoolEnvironment>;
}

export default SchoolLayout;

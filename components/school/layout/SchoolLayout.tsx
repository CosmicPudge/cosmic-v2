import type { ReactNode } from "react";
import { SchoolSidebar } from "./SchoolSidebar";

interface SchoolLayoutProps {
  children: ReactNode;
}

export function SchoolLayout({ children }: SchoolLayoutProps) {
  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="school-ambient-orb absolute -left-40 -top-44 size-[40rem] rounded-full bg-sky-400/[0.08] blur-3xl motion-reduce:animate-none" />
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,rgba(56,89,154,0.25),transparent_62%)]" />
        <div className="school-ambient-orb-delayed absolute right-[-12rem] top-[18rem] size-[30rem] rounded-full bg-indigo-400/[0.08] blur-3xl motion-reduce:animate-none" />
      </div>
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <SchoolSidebar />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
          <div className="school-page-enter mx-auto max-w-7xl motion-reduce:animate-none">{children}</div>
        </div>
      </div>
    </main>
  );
}

export default SchoolLayout;

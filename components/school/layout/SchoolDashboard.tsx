"use client";

import { ReactNode } from "react";

interface SchoolDashboardProps {
  children: ReactNode;
}

export default function SchoolDashboard({
  children,
}: SchoolDashboardProps) {
  return (
      <main className="min-h-screen w-full">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 xl:px-12">
          {children}
        </div>
      </main>
  );
}

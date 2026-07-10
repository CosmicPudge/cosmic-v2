"use client";

import type { ReactNode } from "react";

interface DesktopProps {
  children: ReactNode;
}

export default function Desktop({
  children,
}: DesktopProps) {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-neutral-950 text-white">
      {children}
    </main>
  );
}
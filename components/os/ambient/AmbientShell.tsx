"use client";

import type { ReactNode } from "react";
import CosmicBackground from "../background/CosmicBackground";

interface Props {
  children: ReactNode;
}

export default function AmbientShell({ children }: Props) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        <CosmicBackground />
      </div>

      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />

      <main className="relative z-10 flex h-full items-center justify-center p-10">
        {children}
      </main>
    </div>
  );
}
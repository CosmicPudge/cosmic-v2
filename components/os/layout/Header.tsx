"use client";

import { useEffect } from "react";

import { useBoot } from "@/components/os/boot/BootManager";
import LiveClock from "@/components/os/ui/LiveClock";

export default function Header() {
  const { complete } = useBoot();

  useEffect(() => {
    complete("header");
  }, [complete]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-white/5 px-6 backdrop-blur-xl">
      <h1 className="text-2xl font-bold">Cosmic OS</h1>

      <LiveClock className="text-sm opacity-70" />
    </header>
  );
}

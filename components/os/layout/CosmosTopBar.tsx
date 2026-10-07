"use client";

import Link from "next/link";
import { Bell, CloudSun, Search } from "lucide-react";

import LiveClock from "@/components/os/ui/LiveClock";
import { useSearchRuntime } from "@/components/apps/search/SearchProvider";

export default function CosmosTopBar() {
  const { openSearch } = useSearchRuntime();

  return (
    <header className="cosmos-topbar" aria-label="Cosmos toolbar">
      <button
        type="button"
        className="cosmos-search-trigger"
        onClick={() => openSearch()}
        aria-label="Search Cosmos"
      >
        <Search size={18} />
        <span className="truncate">Search Cosmos</span>
        <kbd className="ml-auto hidden rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/45 sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Link href="/weather" className="cosmos-topbar-chip" title="Open weather">
          <CloudSun size={17} />
          <span className="hidden xl:inline">Weather</span>
        </Link>
        <div className="cosmos-topbar-chip hidden sm:flex" aria-label="Current date and time">
          <LiveClock className="text-xs text-white/78" />
        </div>
        <button type="button" className="cosmos-icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}

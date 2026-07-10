"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apps } from "@/config/apps";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CosmicLauncher({
  open,
  onClose,
}: Props) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredApps = useMemo(() => {
    return apps.filter((app) =>
      app.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  function launch(route: string) {
    router.push(route);

    setQuery("");
    setSelectedIndex(0);

    onClose();
  }

  // Reset selected item whenever search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();

          setSelectedIndex((i) =>
            Math.min(i + 1, filteredApps.length - 1)
          );
          break;

        case "ArrowUp":
          e.preventDefault();

          setSelectedIndex((i) =>
            Math.max(i - 1, 0)
          );
          break;

        case "Enter":
          e.preventDefault();

          if (filteredApps[selectedIndex]) {
            launch(filteredApps[selectedIndex].route);
          }
          break;

        case "Escape":
          e.preventDefault();

          onClose();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, [open, filteredApps, selectedIndex]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />

      {/* Launcher */}
      <div className="fixed left-1/2 top-24 z-50 w-full max-w-2xl -translate-x-1/2 px-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur-2xl">

          {/* Search */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Cosmic..."
            className="
              w-full
              border-b
              border-white/10
              bg-transparent
              px-8
              py-6
              text-2xl
              text-white
              outline-none
              placeholder:text-white/30
            "
          />

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">

            {filteredApps.length === 0 && (
              <div className="p-8 text-center text-white/40">
                No results
              </div>
            )}

            {filteredApps.map((app, index) => (
              <button
                key={app.id}
                onClick={() => launch(app.route)}
                className={`
                  flex
                  w-full
                  items-center
                  gap-5
                  px-8
                  py-5
                  text-left
                  transition-all
                  duration-200
                  ${
                    index === selectedIndex
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }
                `}
              >
                <span className="text-3xl">
                  {app.icon}
                </span>

                <div className="flex flex-col">
                  <span className="text-lg font-medium">
                    {app.name}
                  </span>

                  <span className="text-sm text-white/40">
                    {app.route}
                  </span>
                </div>
              </button>
            ))}

          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { useEffect, useState } from "react";
import OperatingSystem from "@/components/os/core/OperatingSystem";

type Rect = { width: number; height: number; left: number; top: number };
type LayoutState = { viewport: Rect; shell?: Rect; navigation?: Rect; workspace?: Rect; dashboard?: Rect; horizontalOverflow: boolean };

const measure = (element: Element | null): Rect | undefined => {
  if (!element) return undefined;
  const rect = element.getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height), left: Math.round(rect.left), top: Math.round(rect.top) };
};

export default function LayoutDiagnosticsPage() {
  const [layout, setLayout] = useState<LayoutState>({ viewport: { width: 0, height: 0, left: 0, top: 0 }, horizontalOverflow: false });

  useEffect(() => {
    const update = () => setLayout({
      viewport: { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 },
      shell: measure(document.querySelector("[data-cosmic-os-root]")),
      navigation: measure(document.querySelector("[data-cosmic-navigation]")),
      workspace: measure(document.querySelector("[data-cosmic-workspace]")),
      dashboard: measure(document.querySelector("[data-dashboard-root]")),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    });
    update();
    const observer = new ResizeObserver(update);
    ["[data-cosmic-os-root]", "[data-cosmic-navigation]", "[data-cosmic-workspace]", "[data-dashboard-root]"].forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) observer.observe(element);
    });
    window.addEventListener("resize", update);
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, []);

  const rows = [
    ["Viewport", layout.viewport], ["Shell", layout.shell], ["Navigation", layout.navigation], ["Workspace", layout.workspace], ["Dashboard", layout.dashboard],
  ] as const;

  return <><OperatingSystem /><aside className="fixed right-3 top-3 z-[1200] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-cyan-200/25 bg-[#050b1c]/92 p-4 text-white shadow-2xl backdrop-blur-xl"><p className="cosmic-kicker">Cosmic OS / Layout Probe</p><h1 className="mt-2 text-lg font-light tracking-[.12em]">LIVE DIMENSIONS</h1><div className="mt-3 grid gap-2 text-xs">{rows.map(([label, rect]) => <div key={label} className="flex justify-between gap-3 border-b border-white/[.08] py-1.5"><span className="text-violet-200/65">{label}</span><code className="text-cyan-100/80">{rect ? `${rect.width}×${rect.height}` : "not mounted"}</code></div>)}</div><div className={`mt-3 rounded-lg border p-2 ${layout.horizontalOverflow ? "border-rose-300/35 bg-rose-400/10 text-rose-100" : "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"}`}>Horizontal overflow: {layout.horizontalOverflow ? "detected" : "none"}</div></aside></>;
}

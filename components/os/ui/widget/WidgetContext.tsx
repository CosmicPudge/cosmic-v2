"use client";

import { createContext, useContext } from "react";
import type { WidgetSize } from "./types";
import type { WidgetAccent } from "./types";

export type WidgetPresentation = "dashboard" | "kiosk";

const WidgetContext = createContext<{ size: WidgetSize; accent?: WidgetAccent; presentation: WidgetPresentation }>({
  size: "medium",
  presentation: "dashboard",
});

export function WidgetProvider({ children, size, accent, presentation = "dashboard" }: { children: React.ReactNode; size: WidgetSize; accent?: WidgetAccent; presentation?: WidgetPresentation }) {
  return <WidgetContext.Provider value={{ size, accent, presentation }}>{children}</WidgetContext.Provider>;
}

export function useWidgetContext() {
  return useContext(WidgetContext);
}

"use client";

import { createContext, useContext } from "react";
import type { WidgetSize } from "./types";
import type { WidgetAccent } from "./types";

const WidgetContext = createContext<{ size: WidgetSize; accent?: WidgetAccent }>({
  size: "medium",
});

export function WidgetProvider({ children, size, accent }: { children: React.ReactNode; size: WidgetSize; accent?: WidgetAccent }) {
  return <WidgetContext.Provider value={{ size, accent }}>{children}</WidgetContext.Provider>;
}

export function useWidgetContext() {
  return useContext(WidgetContext);
}

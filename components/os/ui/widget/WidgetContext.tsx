"use client";

import { createContext, useContext } from "react";
import type { WidgetSize } from "./types";

const WidgetContext = createContext<{ size: WidgetSize }>({
  size: "medium",
});

export function WidgetProvider({ children, size }: { children: React.ReactNode; size: WidgetSize }) {
  return <WidgetContext.Provider value={{ size }}>{children}</WidgetContext.Provider>;
}

export function useWidgetContext() {
  return useContext(WidgetContext);
}

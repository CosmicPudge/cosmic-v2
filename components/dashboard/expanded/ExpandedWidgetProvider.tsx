"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface ExpandedWidgetContextValue {
  expandedWidget: string | null;

  openWidget: (id: string) => void;

  closeWidget: () => void;

  isExpanded: (id: string) => boolean;
}

const ExpandedWidgetContext =
  createContext<ExpandedWidgetContextValue | null>(null);

export function ExpandedWidgetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expandedWidget, setExpandedWidget] =
    useState<string | null>(null);

  const openWidget = useCallback((id: string) => {
    setExpandedWidget(id);
  }, []);

  const closeWidget = useCallback(() => {
    setExpandedWidget(null);
  }, []);

  const isExpanded = useCallback(
    (id: string) => expandedWidget === id,
    [expandedWidget]
  );

  const value = useMemo(
    () => ({
      expandedWidget,
      openWidget,
      closeWidget,
      isExpanded,
    }),
    [
      expandedWidget,
      openWidget,
      closeWidget,
      isExpanded,
    ]
  );

  return (
    <ExpandedWidgetContext.Provider value={value}>
      {children}
    </ExpandedWidgetContext.Provider>
  );
}

export function useExpandedWidget() {
  const context = useContext(
    ExpandedWidgetContext
  );

  if (!context) {
    throw new Error(
      "useExpandedWidget must be used inside ExpandedWidgetProvider."
    );
  }

  return context;
}
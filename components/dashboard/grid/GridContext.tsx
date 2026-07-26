"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface GridContextValue {
  editMode: boolean;

  selectedWidget: string | null;

  toggleEditMode(): void;

  selectWidget(id: string | null): void;
}

const GridContext =
  createContext<GridContextValue | null>(null);

interface Props {
  children: React.ReactNode;
}

export function GridProvider({
  children,
}: Props) {
  const [editMode, setEditMode] =
    useState(false);

  const [selectedWidget, setSelectedWidget] =
    useState<string | null>(null);

  const toggleEditMode = useCallback(() => {
    setEditMode((value) => !value);

    if (editMode) {
      setSelectedWidget(null);
    }
  }, [editMode]);

  const selectWidget = useCallback(
    (id: string | null) => {
      setSelectedWidget(id);
    },
    []
  );

  const value = useMemo(
    () => ({
      editMode,

      selectedWidget,

      toggleEditMode,

      selectWidget,
    }),
    [
      editMode,
      selectedWidget,
      toggleEditMode,
      selectWidget,
    ]
  );

  return (
    <GridContext.Provider value={value}>
      {children}
    </GridContext.Provider>
  );
}

export function useGrid() {
  const context = useContext(GridContext);

  if (!context) {
    throw new Error(
      "useGrid must be used inside GridProvider."
    );
  }

  return context;
}
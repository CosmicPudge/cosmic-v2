"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  DashboardNotification,
  DashboardState,
} from "./DashboardTypes";

interface DashboardContextValue
  extends DashboardState {
  openAssistant(): void;

  closeAssistant(): void;

  openSearch(): void;

  closeSearch(): void;

  setActiveWidget(
    id: string | null
  ): void;

  setFocusedWidget(
    id: string | null
  ): void;

  toggleEditMode(): void;

  pushNotification(
    notification: Omit<
      DashboardNotification,
      "id" | "createdAt" | "read"
    >
  ): void;

  clearNotifications(): void;
}

const DashboardContext =
  createContext<DashboardContextValue | null>(
    null
  );

interface Props {
  children: React.ReactNode;
}

export function DashboardProvider({
  children,
}: Props) {
  const [state, setState] =
    useState<DashboardState>({
      editMode: false,

      activeWidget: null,

      focusedWidget: null,

      assistantOpen: false,

      searchOpen: false,

      notifications: [],
    });

  const update = useCallback(
    (partial: Partial<DashboardState>) => {
      setState((previous) => ({
        ...previous,
        ...partial,
      }));
    },
    []
  );

  const openAssistant =
    useCallback(() => {
      update({
        assistantOpen: true,
      });
    }, [update]);

  const closeAssistant =
    useCallback(() => {
      update({
        assistantOpen: false,
      });
    }, [update]);

  const openSearch =
    useCallback(() => {
      update({
        searchOpen: true,
      });
    }, [update]);

  const closeSearch =
    useCallback(() => {
      update({
        searchOpen: false,
      });
    }, [update]);

  const setActiveWidget =
    useCallback(
      (id: string | null) => {
        update({
          activeWidget: id,
        });
      },
      [update]
    );

  const setFocusedWidget =
    useCallback(
      (id: string | null) => {
        update({
          focusedWidget: id,
        });
      },
      [update]
    );

  const toggleEditMode =
    useCallback(() => {
      setState((previous) => ({
        ...previous,
        editMode: !previous.editMode,
      }));
    }, []);

  const pushNotification =
    useCallback(
      (
        notification: Omit<
          DashboardNotification,
          "id" | "createdAt" | "read"
        >
      ) => {
        setState((previous) => ({
          ...previous,

          notifications: [
            ...previous.notifications,

            {
              ...notification,

              id: crypto.randomUUID(),

              createdAt: Date.now(),

              read: false,
            },
          ],
        }));
      },
      []
    );

  const clearNotifications =
    useCallback(() => {
      update({
        notifications: [],
      });
    }, [update]);

  const value = useMemo(
    () => ({
      ...state,

      openAssistant,
      closeAssistant,

      openSearch,
      closeSearch,

      setActiveWidget,
      setFocusedWidget,

      toggleEditMode,

      pushNotification,

      clearNotifications,
    }),
    [
      state,

      openAssistant,
      closeAssistant,

      openSearch,
      closeSearch,

      setActiveWidget,
      setFocusedWidget,

      toggleEditMode,

      pushNotification,

      clearNotifications,
    ]
  );

  return (
    <DashboardContext.Provider
      value={value}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context =
    useContext(DashboardContext);

  if (!context) {
    throw new Error(
      "useDashboard must be used inside DashboardProvider."
    );
  }

  return context;
}
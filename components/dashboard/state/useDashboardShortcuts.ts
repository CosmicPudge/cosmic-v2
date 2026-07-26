"use client";

import { useEffect } from "react";

import { useDashboard } from "./DashboardContext";

export function useDashboardShortcuts() {
  const {
    openSearch,
    closeSearch,
    openAssistant,
    closeAssistant,
    toggleEditMode,
    searchOpen,
    assistantOpen,
    editMode,
  } = useDashboard();

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      const target = event.target as HTMLElement | null;

      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTyping) {
        return;
      }

      // /
      if (event.key === "/") {
        event.preventDefault();
        openSearch();
        return;
      }

      // Cmd/Ctrl + K
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        openSearch();
        return;
      }

      // Space
      if (event.code === "Space") {
        event.preventDefault();

        if (assistantOpen) {
          closeAssistant();
        } else {
          openAssistant();
        }

        return;
      }

      // E
      if (
        event.key.toLowerCase() === "e"
      ) {
        toggleEditMode();
        return;
      }

      // Escape
      if (event.key === "Escape") {
        if (searchOpen) {
          closeSearch();
        }

        if (assistantOpen) {
          closeAssistant();
        }

        if (editMode) {
          toggleEditMode();
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    openSearch,
    closeSearch,
    openAssistant,
    closeAssistant,
    toggleEditMode,
    searchOpen,
    assistantOpen,
    editMode,
  ]);
}
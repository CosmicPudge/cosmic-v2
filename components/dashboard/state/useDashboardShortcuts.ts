"use client";

import { useEffect } from "react";

import { useDashboard } from "./DashboardContext";

export function useDashboardShortcuts() {
  const {
    openAssistant,
    closeAssistant,
    toggleEditMode,
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
    openAssistant,
    closeAssistant,
    toggleEditMode,
    assistantOpen,
    editMode,
  ]);
}

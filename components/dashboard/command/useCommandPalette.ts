"use client";

import { useMemo, useState } from "react";

import type { CommandAction } from "./types";
import {
  commandRegistry,
  initializeCommands,
} from "./registry";

export function useCommandPalette() {
  const [query, setQuery] = useState("");

  const commands = useMemo(() => {
    initializeCommands();
    return commandRegistry.getAll();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return commands;
    }

    const value = query.toLowerCase();

    return commands.filter(
      (command: CommandAction) =>
        command.title
          .toLowerCase()
          .includes(value) ||
        command.keywords.some(
          (keyword: string) =>
            keyword.includes(value)
        )
    );
  }, [commands, query]);

  return {
    query,
    setQuery,
    commands: filtered,
  };
}
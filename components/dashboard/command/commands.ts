"use client";

import type { CommandAction } from "./types";

export function createCommands(): CommandAction[] {
  return [
    {
      id: "weather",

      title: "Open Weather",

      subtitle: "Weather forecast",

      category: "Apps",

      keywords: [
        "weather",
        "forecast",
        "temperature",
      ],

      run() {
        console.log("Weather");
      },
    },

    {
      id: "calendar",

      title: "Open Calendar",

      category: "Apps",

      keywords: [
        "calendar",
        "schedule",
      ],

      run() {
        console.log("Calendar");
      },
    },

    {
      id: "assistant",

      title: "Open Cosmic Assistant",

      category: "AI",

      keywords: [
        "assistant",
        "ai",
        "chat",
      ],

      run() {
        console.log("Assistant");
      },
    },

    {
      id: "settings",

      title: "Open Settings",

      category: "Settings",

      keywords: [
        "settings",
        "preferences",
      ],

      run() {
        console.log("Settings");
      },
    },
  ];
}
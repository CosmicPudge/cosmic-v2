"use client";

import AppWindow from "./AppWindow";

export default function AssistantWindow() {
  return (
    <AppWindow
      title="Assistant"
      windowName="assistant"
    >
      <h1 className="text-2xl font-bold">Cosmic Assistant</h1>

      <p className="mt-2 text-white/70">
        Your personal AI assistant is under construction.
      </p>
    </AppWindow>
  );
}
"use client";

import AppWindow from "./AppWindow";

export default function SettingsWindow() {
  return (
    <AppWindow
      title="Settings"
      windowName="settings"
    >
      <h1 className="text-2xl font-bold">Settings</h1>

      <p className="mt-2 text-white/70">
        Settings system coming soon.
      </p>
    </AppWindow>
  );
}
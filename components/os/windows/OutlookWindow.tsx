"use client";

import AppWindow from "./AppWindow";

export default function OutlookWindow() {
  return (
    <AppWindow
      title="Outlook"
      windowName="outlook"
    >
      <h1 className="text-2xl font-bold">Outlook</h1>

      <p className="mt-2 text-white/70">
        Microsoft Outlook integration coming soon.
      </p>
    </AppWindow>
  );
}
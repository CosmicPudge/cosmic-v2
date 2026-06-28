"use client";

import AppWindow from "./AppWindow";

export default function GarageWindow() {
  return (
    <AppWindow
      title="Garage"
      windowName="garage"
    >
      <h1 className="text-2xl font-bold">Garage</h1>

      <p className="mt-2 text-white/70">
        Garage system coming soon.
      </p>
    </AppWindow>
  );
}
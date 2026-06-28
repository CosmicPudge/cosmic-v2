"use client";

import AppWindow from "./AppWindow";

export default function FilesWindow() {
  return (
    <AppWindow
      title="Files"
      windowName="files"
    >
      <h1 className="text-2xl font-bold">Files</h1>

      <p className="mt-2 text-white/70">
        File manager coming soon.
      </p>
    </AppWindow>
  );
}
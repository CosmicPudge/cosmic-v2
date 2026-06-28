"use client";

import AppWindow from "./AppWindow";

export default function ProjectsWindow() {
  return (
    <AppWindow
      title="Projects"
      windowName="projects"
    >
      <h1 className="text-2xl font-bold">Projects</h1>

      <p className="mt-2 text-white/70">
        Project management coming soon.
      </p>
    </AppWindow>
  );
}
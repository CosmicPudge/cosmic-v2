import { create } from "zustand";

export type WindowId =
  | "clock"
  | "weather"
  | "calendar"
  | "garage"
  | "sports"
  | "school"
  | "notes"
  | "projects"
  | "outlook"
  | "assistant"
  | "settings"
  | "system"
  | "music"
  | "files";

export interface WindowState {
  id: WindowId;
  open: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}

interface WindowStore {
  windows: Record<WindowId, WindowState>;

  focusedWindow: WindowId | null;

  openWindow: (id: WindowId) => void;
  closeWindow: (id: WindowId) => void;
  focusWindow: (id: WindowId) => void;
  closeAllWindows: () => void;

  moveWindow: (
    id: WindowId,
    x: number,
    y: number
  ) => void;
}



const defaultWindow = (
  id: WindowId,
  x: number,
  y: number
): WindowState => ({
  id,
  open: false,
  x,
  y,
  width: 700,
  height: 500,
  zIndex: 1,
  minimized: false,
  maximized: false,
});

export const useWindowStore = create<WindowStore>((set) => ({
  windows: {
    clock: defaultWindow("clock", 210, 90),
    weather: defaultWindow("weather", 250, 120),
    calendar: defaultWindow("calendar", 290, 150),
    garage: defaultWindow("garage", 330, 180),
    sports: defaultWindow("sports", 370, 210),
    school: defaultWindow("school", 410, 240),
    notes: defaultWindow("notes", 450, 270),
    projects: defaultWindow("projects", 490, 300),
    outlook: defaultWindow("outlook", 530, 330),
    assistant: defaultWindow("assistant", 570, 360),
    settings: defaultWindow("settings", 610, 390),
    system: defaultWindow("system", 630, 405),
    music: defaultWindow("music", 650, 420),
files: defaultWindow("files", 690, 450),
  },

  focusedWindow: null,

  openWindow: (id) =>
    set((state) => ({
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          open: true,
        },
      },
    })),

  closeWindow: (id) =>
    set((state) => ({
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          open: false,
        },
      },
    })),

    focusWindow: (id) =>
  set((state) => ({
    focusedWindow: id,

    windows: Object.fromEntries(
      Object.entries(state.windows).map(([key, window]) => [
        key,
        {
          ...window,
          zIndex: key === id ? 100 : 1,
        },
      ])
    ) as Record<WindowId, WindowState>,
  })),

moveWindow: (id, x, y) =>
  set((state) => ({
    windows: {
      ...state.windows,
      [id]: {
        ...state.windows[id],
        x,
        y,
      },
    },
  })),
  closeAllWindows: () =>
  set((state) => ({
    windows: Object.fromEntries(
      Object.entries(state.windows).map(([key, window]) => [
        key,
        {
          ...window,
          open: false,
        },
      ])
    ) as Record<WindowId, WindowState>,
  })),
}));

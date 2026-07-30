export type WindowStateType =
  | "normal"
  | "minimized"
  | "maximized"
  | "fullscreen";

export interface WindowInstance {
  id: string;

  title: string;

  state: WindowStateType;
}

export interface WindowContextValue {
  windows: WindowInstance[];

  activeWindowId: string | null;

  openWindow(
    id: string,
    title?: string
  ): void;

  closeWindow(id: string): void;

  focusWindow(id: string): void;
}
import { create } from "zustand";

export type CosmicMode =
  | "desktop"
  | "ambient"
  | "sports";

interface ModeState {
  mode: CosmicMode;

  setMode: (mode: CosmicMode) => void;
}

export const useModeStore = create<ModeState>((set) => ({
  mode: "desktop",

  setMode: (mode) =>
    set({
      mode,
    }),
}));
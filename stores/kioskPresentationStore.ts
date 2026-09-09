import { create } from "zustand";

interface KioskPresentationState {
  active: boolean;
  entry: "manual" | "idle" | null;
  enterManual: () => void;
  enterIdle: () => void;
  exit: () => void;
}

export const useKioskPresentationStore = create<KioskPresentationState>((set) => ({
  active: false,
  entry: null,
  enterManual: () => set({ active: true, entry: "manual" }),
  enterIdle: () => set({ active: true, entry: "idle" }),
  exit: () => set({ active: false, entry: null }),
}));

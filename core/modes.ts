export type CosmicMode =
  | "desktop"
  | "ambient"
  | "drive"
  | "mobile";

class ModeManager {
  private current: CosmicMode = "desktop";

  getCurrent(): CosmicMode {
    return this.current;
  }

  setMode(mode: CosmicMode) {
    this.current = mode;
  }

  is(mode: CosmicMode) {
    return this.current === mode;
  }
}

export const modes = new ModeManager();
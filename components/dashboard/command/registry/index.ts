import { commandRegistry } from "./CommandRegistry";

import { createCommands } from "../commands";

let initialized = false;

export function initializeCommands() {
  if (initialized) {
    return;
  }

  initialized = true;

  createCommands().forEach((command) =>
    commandRegistry.register(command)
  );
}

export { commandRegistry };
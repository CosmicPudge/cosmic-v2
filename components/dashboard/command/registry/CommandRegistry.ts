import type { CommandAction } from "../types";

export class CommandRegistry {
  private commands = new Map<
    string,
    CommandAction
  >();

  register(
    command: CommandAction
  ) {
    this.commands.set(
      command.id,
      command
    );
  }

  unregister(id: string) {
    this.commands.delete(id);
  }

  get(id: string) {
    return this.commands.get(id);
  }

  getAll() {
    return Array.from(
      this.commands.values()
    );
  }

  clear() {
    this.commands.clear();
  }
}

export const commandRegistry =
  new CommandRegistry();
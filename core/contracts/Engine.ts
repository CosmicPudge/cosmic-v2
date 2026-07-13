export interface Engine<T, C = void> {
  initialize(config?: C): Promise<void>;

  refresh(): Promise<void>;

  getSnapshot(): Promise<T>;

  isReady(): boolean;

  getLastUpdated(): Date | null;
}
export interface Action {
  id: string;
  name: string;

  execute(): Promise<void>;
}

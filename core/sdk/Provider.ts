export interface Provider {
  id: string;

  connect(): Promise<void>;
  refresh(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface CosmicEvent<T = unknown> {
  type: string;
  payload?: T;
}
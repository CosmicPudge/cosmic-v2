export interface Intelligence {
  summarize(): Promise<unknown>;
  getContext(): Promise<unknown>;
  getMission(): Promise<unknown>;
  getRecommendations(): Promise<unknown>;
}

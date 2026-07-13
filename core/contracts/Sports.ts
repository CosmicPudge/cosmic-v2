export interface TeamSnapshot {
  team: string;

  league: string;

  nextGame?: Date;

  opponent?: string;

  live: boolean;

  score?: string;

  record?: string;
}

export interface SportsSnapshot {
  favorites: TeamSnapshot[];
}
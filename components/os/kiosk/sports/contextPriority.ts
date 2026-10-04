export type FootballContextMode = "normal" | "timeout" | "halftime" | "flag" | "review" | "red-zone" | "final";

export function footballContextPriority(mode: FootballContextMode) {
  switch (mode) {
    case "review": return ["review", "team-stats", "recent-drives"] as const;
    case "flag": return ["penalty", "drive", "recent-drives"] as const;
    case "halftime": return ["team-stats", "leaders", "scoring", "linescore", "recent-drives"] as const;
    case "timeout": return ["drive", "team-stats", "recent-drives"] as const;
    case "red-zone": return ["drive", "team-stats", "recent-drives"] as const;
    case "final": return ["linescore", "team-stats", "scoring", "leaders"] as const;
    default: return ["play", "drive", "recent-drives", "team-stats", "leaders", "scoring", "linescore"] as const;
  }
}

"use client";

import { useState } from "react";
import Image from "next/image";
import type { SportKind, SportsTeam } from "@/core/contracts/Sports";
import { initialsForTeam, resolveSportsTeamIdentity } from "@/services/sports/identity";

export default function SportsTeamLogo({ sport, team, size = "md", fallback = "initials" }: { sport: SportKind; team?: SportsTeam; size?: "sm" | "md" | "lg"; fallback?: "initials" | "none" }) {
  const identity = resolveSportsTeamIdentity(sport, team);
  const [failed, setFailed] = useState(false);
  const dimensions = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-20 w-20" : "h-14 w-14";
  const pixelSize = size === "sm" ? 36 : size === "lg" ? 80 : 56;
  if (!identity?.logoPath || failed) return fallback === "none" ? null : <span className={`${dimensions} grid shrink-0 place-items-center rounded-full border border-cyan-200/25 bg-cyan-200/[.05] text-xs font-bold text-cyan-100/80`} aria-label={`${team?.name ?? "Team"} logo unavailable`}>{initialsForTeam(team)}</span>;
  return <span className={`${dimensions} grid shrink-0 place-items-center`}><Image src={identity.logoPath} alt={`${identity.name} logo`} width={pixelSize} height={pixelSize} unoptimized className="h-full w-full object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,.3)]" onError={() => setFailed(true)} /></span>;
}

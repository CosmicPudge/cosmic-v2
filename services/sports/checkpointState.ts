import type { SportsEvent, SportsEventStatus } from "@/core/contracts/Sports";

const MAX_STATE_BYTES = 16_384;

export interface SportsCheckpointState {
  status: SportsEventStatus;
  startTime: string;
  homeScore?: number;
  awayScore?: number;
  period?: number;
  clock?: string;
  sessionKind?: string;
  driverId?: string;
  constructorId?: string;
  qualifyingPosition?: number;
  gridPosition?: number;
  finishingPosition?: number;
  points?: number;
}

export function checkpointState(event: SportsEvent): SportsCheckpointState {
  const metadata = event.metadata;
  const state: SportsCheckpointState = {
    status: event.status,
    startTime: event.start.toISOString(),
    ...(event.homeTeam?.score !== undefined ? { homeScore: event.homeTeam.score } : {}),
    ...(event.awayTeam?.score !== undefined ? { awayScore: event.awayTeam.score } : {}),
    ...(metadata?.period !== undefined ? { period: metadata.period } : {}),
    ...(metadata?.clock ? { clock: metadata.clock } : {}),
    ...(metadata?.sessionKind ? { sessionKind: metadata.sessionKind } : {}),
    ...(metadata?.driverId ? { driverId: metadata.driverId } : {}),
    ...(metadata?.constructorId ? { constructorId: metadata.constructorId } : {}),
    ...(metadata?.qualifyingPosition !== undefined ? { qualifyingPosition: metadata.qualifyingPosition } : {}),
    ...(metadata?.gridPosition !== undefined ? { gridPosition: metadata.gridPosition } : {}),
    ...(metadata?.finishingPosition !== undefined ? { finishingPosition: metadata.finishingPosition } : {}),
    ...(metadata?.points !== undefined ? { points: metadata.points } : {}),
  };
  if (Buffer.byteLength(JSON.stringify(state), "utf8") > MAX_STATE_BYTES) {
    throw new Error("Sports checkpoint state exceeds the safe size limit.");
  }
  return state;
}

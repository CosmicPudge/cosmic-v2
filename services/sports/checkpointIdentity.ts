import type { SportsEvent } from "@/core/contracts/Sports";

export interface SportsCheckpointIdentity {
  provider: string;
  sport: SportsEvent["sport"];
  eventId: string;
}

export function checkpointId(identity: SportsCheckpointIdentity) {
  return `${identity.provider}:${identity.sport}:${identity.eventId}`;
}

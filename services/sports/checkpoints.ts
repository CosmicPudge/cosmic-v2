import "server-only";

import { and, eq, lt } from "drizzle-orm";

import type { SportsEvent } from "@/core/contracts/Sports";
import { getDatabase } from "@/services/database/client";
import { sportsEventCheckpoints } from "@/services/database/schema";
import { checkpointState, type SportsCheckpointState } from "./checkpointState";
import { checkpointId, type SportsCheckpointIdentity } from "./checkpointIdentity";

export async function compareAndAdvanceCheckpoint(identity: SportsCheckpointIdentity, event: SportsEvent, observedAt = new Date()) {
  const state = checkpointState(event);
  const database = getDatabase();
  const id = checkpointId(identity);
  const inserted = await database.insert(sportsEventCheckpoints).values({ id, provider: identity.provider, sport: identity.sport, eventId: identity.eventId, eventStatus: state.status, normalizedState: state, observedAt, createdAt: observedAt, updatedAt: observedAt }).onConflictDoNothing({ target: [sportsEventCheckpoints.provider, sportsEventCheckpoints.sport, sportsEventCheckpoints.eventId] }).returning({ id: sportsEventCheckpoints.id });
  if (inserted[0]) return { baseline: true, advanced: true, previous: undefined, current: state };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [previous] = await database.select({ id: sportsEventCheckpoints.id, state: sportsEventCheckpoints.normalizedState, updatedAt: sportsEventCheckpoints.updatedAt }).from(sportsEventCheckpoints).where(and(eq(sportsEventCheckpoints.provider, identity.provider), eq(sportsEventCheckpoints.sport, identity.sport), eq(sportsEventCheckpoints.eventId, identity.eventId))).limit(1);
    if (!previous) continue;
    if (JSON.stringify(previous.state) === JSON.stringify(state)) return { baseline: false, advanced: false, previous: previous.state as SportsCheckpointState, current: state };
    const updated = await database.update(sportsEventCheckpoints).set({ eventStatus: state.status, normalizedState: state, observedAt, updatedAt: observedAt }).where(and(eq(sportsEventCheckpoints.id, previous.id), eq(sportsEventCheckpoints.updatedAt, previous.updatedAt))).returning({ id: sportsEventCheckpoints.id });
    if (updated[0]) return { baseline: false, advanced: true, previous: previous.state as SportsCheckpointState, current: state };
  }
  return { baseline: false, advanced: false, previous: undefined, current: state, contention: true };
}

export async function pruneSportsCheckpoints(before: Date) {
  const result = await getDatabase().delete(sportsEventCheckpoints).where(lt(sportsEventCheckpoints.observedAt, before));
  return result;
}

import "server-only";

import type { SportsSnapshot } from "@/core/contracts/Sports";
import type { CosmicUserPreferences } from "@/core/contracts/Settings";
import { getAccountPreferences } from "@/services/settings/accountPreferences";
import { neutralPreferences } from "@/services/settings/preferences";
import { buildSportsSignals } from "@/services/sports/signals";
import { getSportsSnapshot } from "@/services/sports/snapshot";
import { compareAndAdvanceCheckpoint, pruneSportsCheckpoints } from "./checkpoints";
import { checkpointId } from "./checkpointIdentity";
import { deliverSportsSignalToUser } from "@/services/push/delivery";
import { getActivePushUserIds } from "@/services/push/store";

function sharedFetchPreferences(accounts: Array<{ preferences: CosmicUserPreferences }>): CosmicUserPreferences {
  const source = accounts[0]?.preferences ?? neutralPreferences;
  const enabledSports = new Set<CosmicUserPreferences["sports"]["enabledSports"][number]>();
  const followedTeams = new Map<string, CosmicUserPreferences["sports"]["followedTeams"][number]>();
  const followedDrivers = new Map<string, CosmicUserPreferences["sports"]["followedDrivers"][number]>();
  const followedConstructors = new Map<string, CosmicUserPreferences["sports"]["followedConstructors"][number]>();
  for (const account of accounts) {
    for (const sport of account.preferences.sports.enabledSports) enabledSports.add(sport);
    for (const team of account.preferences.sports.followedTeams) followedTeams.set(`${team.sport}:${team.teamId}`, team);
    for (const driver of account.preferences.sports.followedDrivers) followedDrivers.set(`${driver.sport ?? "f1"}:${driver.id}`, driver);
    for (const constructor of account.preferences.sports.followedConstructors) followedConstructors.set(`${constructor.sport ?? "f1"}:${constructor.id}`, constructor);
  }
  return { ...source, sports: { ...source.sports, enabledSports: [...enabledSports], followedTeams: [...followedTeams.values()], followedDrivers: [...followedDrivers.values()], followedConstructors: [...followedConstructors.values()] } };
}

function events(snapshot: SportsSnapshot) { return [...snapshot.live, ...snapshot.upcoming, ...snapshot.recent]; }

function signalEvent(snapshot: SportsSnapshot, href: string | undefined, signalId: string) {
  const match = events(snapshot).find((event) => href?.endsWith(encodeURIComponent(event.id)));
  return match ? { eventId: match.id, sport: match.sport } : { eventId: signalId.split(":").at(-2), sport: undefined };
}

export async function runSportsPushCycle(now = new Date()) {
  const users = await getActivePushUserIds();
  const accountPreferences = await Promise.all(users.map(async ({ userId }) => ({ userId, preferences: await getAccountPreferences(userId) })));
  const snapshots = new Map<string, SportsSnapshot>();
  let failures = 0;
  const fetchKey = "shared-active-push-user-favorites";
  if (accountPreferences.length) {
    try { snapshots.set(fetchKey, await getSportsSnapshot(now, sharedFetchPreferences(accountPreferences))); } catch { failures += 1; }
  }
  const checkpointResults = new Map<string, Awaited<ReturnType<typeof compareAndAdvanceCheckpoint>>>();
  let eventsProcessed = 0;
  let checkpointsEstablished = 0;
  let transitionsDetected = 0;
  for (const snapshot of snapshots.values()) {
    for (const event of events(snapshot)) {
      const identity = { provider: event.provider ?? event.source, sport: event.sport, eventId: event.id };
      const key = checkpointId(identity);
      if (checkpointResults.has(key)) continue;
      try {
        const result = await compareAndAdvanceCheckpoint(identity, event, now);
        checkpointResults.set(key, result);
        eventsProcessed += 1;
        if (result.baseline) checkpointsEstablished += 1;
        else if (result.advanced) transitionsDetected += 1;
      } catch { /* one malformed event must not stop another provider */ }
    }
  }
  let signalsGenerated = 0;
  let deliveriesAttempted = 0;
  let deliveriesSuccessful = 0;
  let temporaryFailures = 0;
  let expiredSubscriptions = 0;
  for (const account of accountPreferences) {
    const snapshot = snapshots.get(fetchKey);
    if (!snapshot) continue;
    const previous = Object.fromEntries(events(snapshot).flatMap((event) => {
      const result = checkpointResults.get(checkpointId({ provider: event.provider ?? event.source, sport: event.sport, eventId: event.id }));
      return result?.previous ? [[event.id, result.previous]] : [];
    }));
    const signals = buildSportsSignals(snapshot, account.preferences, now, previous);
    signalsGenerated += signals.length;
    for (const signal of signals) {
      const event = signalEvent(snapshot, signal.href, signal.id);
      const result = await deliverSportsSignalToUser(account.userId, { signalId: signal.id, title: signal.title, body: signal.body ?? "Sports update available.", route: signal.href ?? "/sports", category: signal.category ?? "SPORTS", tag: signal.id, ...event });
      deliveriesAttempted += result.length;
      deliveriesSuccessful += result.filter((item) => item === "delivered").length;
      temporaryFailures += result.filter((item) => item === "temporary_failure").length;
      expiredSubscriptions += result.filter((item) => item === "expired").length;
    }
  }
  await pruneSportsCheckpoints(new Date(now.getTime() - 14 * 24 * 60 * 60_000));
  return { usersConsidered: users.length, uniquePreferenceSets: snapshots.size, eventsDiscovered: [...snapshots.values()].reduce((sum, snapshot) => sum + events(snapshot).length, 0), eventsProcessed, checkpointsEstablished, transitionsDetected, signalsGenerated, deliveriesAttempted, deliveriesSuccessful, temporaryFailures, expiredSubscriptions, providerFailures: [...snapshots.values()].reduce((sum, snapshot) => sum + snapshot.providerErrors.length, 0), isolatedFetchFailures: failures };
}

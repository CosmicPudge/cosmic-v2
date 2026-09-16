import "server-only";

import { CosmicCore } from "./CosmicCore";

import { AppleCalendarProvider } from "@/services/calendar/appleCalendarProvider";
import { AppleCalendarWriter } from "@/services/calendar/appleCalendarWriter";
import { TestCalendarProvider } from "@/services/calendar/testCalendarProvider";
import { SubscriptionCalendarProvider } from "@/services/calendar/subscriptionCalendarProvider";
import { CombinedCalendarProvider } from "@/services/calendar/combinedCalendarProvider";
import { getCalendarSubscriptions } from "@/services/calendar/subscriptionConfig";
import { MailEngine } from "@/engines/mail";
import { getGmailToken, GmailProvider, getPersonalGmailToken, refreshPersonalGmailToken, resolveGoogleCredential, storePersonalGmailToken, type GmailToken } from "@/services/mail/gmail";
import { resolveMicrosoftCredential, OutlookProvider, storePersonalOutlookToken, type OutlookToken } from "@/services/mail/outlook";
import { getConnectionsForCapability } from "@/services/providers/capabilities";
import { getProviderCredentials, listProviderConnections, setProviderCredentials } from "@/services/providers/store";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { providerAccessContext } from "@/services/providers/access";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";
import { getAccountCalendarContext } from "@/services/calendar/accountProvider";
import { isDatabaseConfigured } from "@/services/database/client";
import { personalCalendarAccessContext } from "@/services/calendar/access";
import { getPersonalCalendarContext } from "@/services/calendar/personalProvider";

const shouldUseAppleCalendar =
  process.env.NODE_ENV !== "production" &&
  process.env.COSMIC_CALENDAR_PROVIDER !== "test" &&
  Boolean(
    process.env.APPLE_CALENDAR_USERNAME
  ) &&
  Boolean(
    process.env.APPLE_CALENDAR_PASSWORD
  );

const appleProvider =
  shouldUseAppleCalendar
    ? new AppleCalendarProvider()
    : new TestCalendarProvider();

const appleCalendarWriter =
  shouldUseAppleCalendar
    ? new AppleCalendarWriter()
    : null;

const subscriptions =
  getCalendarSubscriptions();

const subscriptionProvider =
  subscriptions.length > 0
    ? new SubscriptionCalendarProvider(
        subscriptions
      )
    : null;

const calendarProvider =
  subscriptionProvider
    ? new CombinedCalendarProvider([
        appleProvider,
        subscriptionProvider,
      ])
    : appleProvider;

export const serverCosmic =
  new CosmicCore(calendarProvider);

export function getAppleCalendarWriter(): AppleCalendarWriter | null {
  return appleCalendarWriter;
}

export async function getAccountCalendarWriter(request: Request): Promise<AppleCalendarWriter | null> {
  if (personalCalendarAccessContext(request)) return (await getPersonalCalendarContext())?.writer ?? null;
  const account = await getCurrentCosmicAccount(request);
  const connectionId = new URL(request.url).searchParams.get("connectionId") ?? undefined;
  if (account && isDatabaseConfigured()) return (await getAccountCalendarContext(account.id, connectionId))?.writer ?? null;
  return process.env.NODE_ENV === "production" ? null : appleCalendarWriter;
}

export async function refreshAppleCalendarAfterWrite(request?: Request): Promise<void> {
  if (request && (await getCurrentCosmicAccount(request)) && isDatabaseConfigured()) return;
  if (appleProvider instanceof AppleCalendarProvider) {
    appleProvider.invalidateCache();
  }

  try {
    await serverCosmic.calendar.refresh();
  } catch (error) {
    // A subscription refresh must not turn a successful Apple CalDAV write
    // into a failed create response.
    console.error(
      "Calendar snapshot refresh after Apple write failed:",
      error instanceof Error ? error.message : "Unknown calendar error"
    );
  }
}

export async function getServerMailEngine(request?: Request): Promise<MailEngine | null> {
  const personal = request ? resolvePrivateRequestContext(request, "private-personal") : null;
  if (personal) {
    try {
      const token = await resolveGoogleCredential(providerAccessContext(personal));
      if (token) return new MailEngine(new GmailProvider(token, "", async (next) => { await storePersonalGmailToken(next); }));
      const outlookToken = await resolveMicrosoftCredential(providerAccessContext(personal));
      return outlookToken ? new MailEngine(new OutlookProvider(outlookToken, "", "", async (next) => { await storePersonalOutlookToken(next); })) : null;
    } catch { return null; }
  }
  const account = request ? await getCurrentCosmicAccount(request) : null;
  if (account && isDatabaseConfigured()) {
    const connection = (await listProviderConnections(account.id)).find((item) => item.provider === "gmail");
    const token = connection ? await getProviderCredentials(account.id, connection.id) : null;
    return token && connection ? new MailEngine(new GmailProvider(token as unknown as GmailToken, connection.email ?? undefined, async (next) => { await setProviderCredentials(account.id, connection.id, next as unknown as Record<string, unknown>); })) : null;
  }
  if (account) return null;
  if (process.env.NODE_ENV === "production") return null;
  const token = getGmailToken();
  return token ? new MailEngine(new GmailProvider(token)) : null;
}

export async function getServerGmailToken(request: Request): Promise<GmailToken | null> {
  const personal = resolvePrivateRequestContext(request, "private-personal");
  if (personal) {
    try {
      const token = await getPersonalGmailToken();
      return token && token.expires_at && token.expires_at <= Date.now() + 60_000 && token.refresh_token
        ? await refreshPersonalGmailToken(token)
        : token;
    } catch { return null; }
  }
  const account = await getCurrentCosmicAccount(request);
  if (account && !isDatabaseConfigured()) return null;
  if (!account) return process.env.NODE_ENV === "production" ? null : getGmailToken();
  const connection = (await listProviderConnections(account.id)).find((item) => item.provider === "gmail");
  return connection ? await getProviderCredentials<GmailToken>(account.id, connection.id) : null;
}

export async function getServerSchoolMailProviders(request: Request) {
  const account = await getCurrentCosmicAccount(request);
  if (!account || !isDatabaseConfigured()) return [];
  const providers: Array<{ provider: "gmail" | "outlook"; connectionId: string; engine: MailEngine }> = [];
  const connections = await getConnectionsForCapability(account.id, "mail.read");
  for (const connection of connections.filter((item) => item.provider === "gmail" || item.provider === "outlook")) {
    const token = await getProviderCredentials(account.id, connection.id);
    if (!token) continue;
    if (connection.provider === "gmail") providers.push({ provider: "gmail", connectionId: connection.id, engine: new MailEngine(new GmailProvider(token as unknown as GmailToken, connection.email ?? undefined, async (next) => { await setProviderCredentials(account.id, connection.id, next as unknown as Record<string, unknown>); })) });
    else providers.push({ provider: "outlook", connectionId: connection.id, engine: new MailEngine(new OutlookProvider(token as unknown as OutlookToken, connection.id, account.id)) });
  }
  return providers;
}

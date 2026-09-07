import { cosmicApi } from "./apiBase";

export type CosmicCallState =
  | "idle"
  | "ringing"
  | "dialing"
  | "connected"
  | "held"
  | "ended";

export type CosmicCallStatus = {
  state: CosmicCallState;
  callId: string | null;
  outgoing: boolean | null;
  connectedAt: string | null;
  observedAt: string;
  sequence: number;
  deviceId: string;
  sessionId: string;
  expiresAt: string;
};

type CallResponse = {
  call: CosmicCallStatus | null;
};

const CALL_API = cosmicApi("call");

export async function getCosmicCallStatus(): Promise<CosmicCallStatus | null> {
  const headers: HeadersInit = {};
  // A relay token is a local-only development escape hatch. Never embed one
  // in a production browser bundle; production uses the authenticated session.
  const relayToken = import.meta.env.DEV
    ? import.meta.env.VITE_COSMIC_CALL_RELAY_TOKEN
    : undefined;
  if (relayToken) {
    headers["x-cosmic-call-relay-token"] = relayToken;
  }

  const response = await fetch(CALL_API, {
    cache: "no-store",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Cosmic call relay returned ${response.status}`);
  }

  const body = await response.json() as CallResponse;
  return body.call;
}

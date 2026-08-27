import dns from "node:dns/promises";

const MAX_FEED_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;

function isPrivateIpv4(value: string) {
  const octets = value.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  return octets[0] === 10 || octets[0] === 127 || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168) || octets[0] === 0;
}

function isPrivateAddress(value: string) {
  const hostname = value.toLowerCase().replace(/^\[|\]$/g, "");
  return hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80:") || isPrivateIpv4(hostname);
}

export async function normalizeSubscriptionUrl(input: string) {
  const raw = input.trim();
  const candidate = raw.toLowerCase().startsWith("webcal://") ? `https://${raw.slice("webcal://".length)}` : raw;
  let parsed: URL;
  try { parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`); } catch { throw new Error("Enter a valid calendar subscription link."); }
  if (parsed.protocol !== "https:") throw new Error("Calendar subscriptions require a secure HTTPS link.");
  if (parsed.username || parsed.password || isPrivateAddress(parsed.hostname)) throw new Error("This calendar link points to a private or unsafe destination.");
  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) throw new Error("This calendar link points to a private or unsafe destination.");
  return parsed.toString();
}

export async function fetchSubscriptionText(input: string) {
  let url = await normalizeSubscriptionUrl(input);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { redirect: "manual", signal: controller.signal, cache: "no-store", headers: { Accept: "text/calendar, text/plain, */*" } });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirects === MAX_REDIRECTS) throw new Error("Calendar subscription redirected too many times.");
        url = await normalizeSubscriptionUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) throw new Error("Subscription could not be reached.");
      if (Number(response.headers.get("content-length") ?? 0) > MAX_FEED_BYTES) throw new Error("Calendar subscription is too large.");
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_FEED_BYTES) throw new Error("Calendar subscription is too large.");
      return { url, text };
    } catch (error) {
      if (error instanceof Error && /Calendar subscription|Subscription could not|too large|unsafe/.test(error.message)) throw error;
      throw new Error("Subscription could not be reached.");
    } finally { clearTimeout(timer); }
  }
  throw new Error("Subscription could not be reached.");
}

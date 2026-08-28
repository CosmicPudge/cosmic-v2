import { NextResponse, type NextRequest } from "next/server";

import { getCurrentCosmicAccount } from "@/services/auth/server";
import { authReturnUrl } from "@/services/auth/returnUrl";

const PUBLIC_API_ROUTES = new Set([
  "/api/account/session", "/api/account/signin", "/api/account/signup", "/api/account/signout",
  "/api/devices/pair", "/api/devices/pair/status",
  "/api/devices/handoff", "/api/devices/handoff/consume",
  "/api/devices/lifecycle",
  "/api/devices/pair/initial-enroll",
  "/api/devices/bootstrap",
  "/api/devices/enrollment/challenge", "/api/devices/enrollment/grant",
  "/api/devices/enrollment/stage", "/api/devices/enrollment/redeem",
  "/api/auth/google/callback", "/api/auth/spotify/callback", "/api/billing/webhook",
  "/api/finance/webhooks/plaid", "/api/internal/finance/sync",
]);

function isDeviceReadApi(pathname: string) {
  return pathname === "/api/devices/kiosk-profile"
    || pathname === "/api/devices/kiosk-control"
    || pathname === "/api/weather"
    || pathname === "/api/sports"
    || pathname.startsWith("/api/sports/event/")
    || pathname === "/api/calendar"
    || pathname === "/api/music"
    || pathname === "/api/clock/alarms";
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  if (isApi && PUBLIC_API_ROUTES.has(pathname)) return NextResponse.next();
  // Kiosk must reach its own pairing gate before any private content can mount.
  if (pathname === "/os/kiosk") return NextResponse.next();
  try {
    const allowDevice = isDeviceReadApi(pathname);
    const authenticated = await getCurrentCosmicAccount(request, { allowDevice, bootId: allowDevice ? request.nextUrl.searchParams.get("cosmic-boot") ?? undefined : undefined });
    if (pathname === "/api/weather" && process.env.NODE_ENV !== "production") console.info(`[weather] proxy-auth=${authenticated ? "accepted" : "rejected"} bootPresent=${Boolean(request.nextUrl.searchParams.get("cosmic-boot"))}`);
    if (authenticated) return NextResponse.next();
  } catch { /* Private requests fail closed when auth infrastructure is unavailable. */ }
  if (isApi) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const url = new URL("/account", request.url);
  url.searchParams.set("returnTo", authReturnUrl(`${pathname}${request.nextUrl.search}`));
  return NextResponse.redirect(url);
}

export const config = { matcher: [
  "/os/:path*", "/finance/:path*", "/sports/:path*", "/calendar/:path*", "/school/:path*",
  "/projects/:path*", "/notes/:path*", "/music/:path*", "/garage/:path*", "/clock/:path*",
  "/notifications/:path*", "/cosmic-ai/:path*", "/ai/:path*", "/assistant/:path*", "/gmail/:path*",
  "/outlook/:path*", "/settings/:path*", "/search/:path*", "/weather/:path*", "/system/:path*",
  "/cosmic-plus/:path*", "/api/:path*",
] };

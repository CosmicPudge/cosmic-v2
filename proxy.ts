import { NextResponse, type NextRequest } from "next/server";

import { getCurrentCosmicAccount } from "@/services/auth/server";

import { authReturnUrl } from "@/services/auth/returnUrl";
import { isPersonalOsUiRoute, isPersonalSchoolUiRoute } from "@/services/auth/proxyPolicy";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";

const PUBLIC_API_ROUTES = new Set([
  "/api/account/session",
  "/api/account/signin",
  "/api/account/signup",
  "/api/account/signout",
  "/api/account/password-reset/request",
  "/api/account/password-reset/confirm",
  "/api/account/auth-methods",
  "/api/auth/google/identity",
  "/api/auth/google/identity/callback",
  "/api/auth/microsoft/identity",
  "/api/auth/microsoft/identity/callback",
  "/api/auth/apple",
  "/api/auth/apple/callback",

  "/api/devices/pair",
  "/api/devices/pair/status",
  "/api/devices/handoff",
  "/api/devices/handoff/consume",
  "/api/devices/lifecycle",
  "/api/devices/pair/initial-enroll",
  "/api/devices/bootstrap",
  "/api/devices/enrollment/challenge",
  "/api/devices/enrollment/grant",
  "/api/devices/enrollment/stage",
  "/api/devices/enrollment/redeem",

  "/api/auth/google/callback",
  "/api/auth/spotify/callback",
  "/api/billing/webhook",
  "/api/finance/webhooks/plaid",
  "/api/internal/finance/sync",
]);

function isDeviceReadApi(pathname: string) {
  return (
    pathname === "/api/devices/kiosk-profile" ||
    pathname === "/api/devices/kiosk-control" ||
    pathname === "/api/weather" ||
    pathname === "/api/sports" ||
    pathname.startsWith("/api/sports/event/") ||
    pathname === "/api/calendar" ||
    pathname === "/api/music" ||
    pathname === "/api/clock/alarms"
    || pathname === "/api/glasses/call"
  );
}

function isGlassesApi(pathname: string) {
  return pathname === "/api/glasses" || pathname.startsWith("/api/glasses/");
}

function isDeveloperKioskRequest(request: NextRequest) {
  if (process.env.COSMIC_DEV_KIOSK_ENABLED !== "true") return false;
  const host = request.nextUrl.hostname.toLowerCase();
  const configuredHost = (process.env.COSMIC_KIOSK_HOSTNAME ?? "dev.cosmicpudge.shop").toLowerCase();
  return host === configuredHost || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(host));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isApi = pathname.startsWith("/api/");
  const isPhoneGlasses =
    pathname === "/dev/phone-glasses" ||
    pathname.startsWith("/dev/phone-glasses/");

  // Local CallKit POC development only. Production must still pass the
  // normal proxy and route-level authentication checks.
  if (
    process.env.NODE_ENV !== "production" &&
    pathname === "/api/call-relay/state"
  ) {
    return NextResponse.next();
  }

  if (isApi && PUBLIC_API_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/api/dev/auth-diagnostics" && isDeveloperKioskRequest(request)) {
    return NextResponse.next();
  }

  if (pathname === "/api/dev/db-connection-diagnostics" && isDeveloperKioskRequest(request)) {
    return NextResponse.next();
  }

  // Personal School is browser-local. Keep this exception page-only: every
  // /api/** request continues through the normal API authorization boundary.
  if (!isApi && isPersonalSchoolUiRoute(pathname)) {
    return NextResponse.next();
  }

  // Local School UI may mount through the personal request boundary. Only
  // the calendar adapter is currently converted; other School APIs retain
  // their existing account/ownership authorization.
  const isPersonalSchoolDevelopmentRequest = process.env.NODE_ENV === "development"
    && (pathname === "/school" || pathname.startsWith("/school/") || pathname === "/api/school" || pathname.startsWith("/api/school/"))
    && Boolean(resolvePrivateRequestContext(request, "private-personal"));
  if (isPersonalSchoolDevelopmentRequest && isApi && pathname !== "/api/school/calendar") {
    return NextResponse.json(
      { error: "school-storage-unavailable-in-personal-mode" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (isPersonalSchoolDevelopmentRequest) {
    return NextResponse.next();
  }

  // The Finance page is personal/local-first, but connected Finance remains
  // durable and account-owned until an explicit storage mapping exists.
  const isPersonalFinanceDevelopmentRequest = process.env.NODE_ENV === "development"
    && Boolean(resolvePrivateRequestContext(request, "private-personal"))
    && (pathname === "/finance" || pathname.startsWith("/finance/") || pathname.startsWith("/api/finance/"));
  if (isPersonalFinanceDevelopmentRequest && isApi) {
    return NextResponse.json(
      { error: "storage-unavailable-in-personal-mode" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (isPersonalFinanceDevelopmentRequest) {
    return NextResponse.next();
  }

  const isPersonalCalendarDevelopmentRequest = process.env.NODE_ENV === "development"
    && Boolean(resolvePrivateRequestContext(request, "private-personal"))
    && (
      pathname === "/calendar"
      || pathname.startsWith("/calendar/")
      || pathname === "/api/calendar"
      || pathname.startsWith("/api/calendar/")
    );
  if (isPersonalCalendarDevelopmentRequest) {
    return NextResponse.next();
  }

  if ((pathname === "/api/kiosk/data" || pathname === "/api/kiosk/diagnostics" || pathname === "/api/kiosk/auth-status" || pathname === "/api/sports" || pathname === "/api/music") && isDeveloperKioskRequest(request)) {
    return NextResponse.next();
  }

  // Cosmic Glasses local development.
  // Production still requires normal authentication/device enrollment.
  if (
    process.env.NODE_ENV !== "production" &&
    isGlassesApi(pathname)
  ) {
    return NextResponse.next();
  }

  if (isPhoneGlasses) {
    try {
      if (await getCurrentCosmicAccount(request)) return NextResponse.next();
    } catch {
      // Protected phone simulator access fails closed when auth is unavailable.
    }

    const url = new URL("/account", request.url);
    url.searchParams.set(
      "returnTo",
      authReturnUrl(`${pathname}${request.nextUrl.search}`),
    );
    return NextResponse.redirect(url);
  }

  // Kiosk must reach its own pairing gate before any private content can mount.
  if (pathname === "/os/kiosk") {
    return NextResponse.next();
  }

  // The normal Cosmic shell is a personal application. Keep this exemption
  // below the kiosk branch and above account-backed request authorization so
  // device mode and private APIs retain their existing boundaries.
  if (isPersonalOsUiRoute(pathname)) {
    return NextResponse.next();
  }

  try {
    const allowDevice = isDeviceReadApi(pathname);

    const authenticated = await getCurrentCosmicAccount(request, {
      allowDevice,
      bootId: allowDevice
        ? request.nextUrl.searchParams.get("cosmic-boot") ?? undefined
        : undefined,
    });

    if (
      pathname === "/api/weather" &&
      process.env.NODE_ENV !== "production"
    ) {
      console.info(
        `[weather] proxy-auth=${authenticated ? "accepted" : "rejected"} bootPresent=${Boolean(
          request.nextUrl.searchParams.get("cosmic-boot"),
        )}`,
      );
    }

    if (authenticated) {
      return NextResponse.next();
    }
  } catch {
    // Private requests fail closed when auth infrastructure is unavailable.
  }

  if (isApi) {
    return NextResponse.json(
      {
        error: "Authentication required.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const url = new URL("/account", request.url);

  url.searchParams.set(
    "returnTo",
    authReturnUrl(`${pathname}${request.nextUrl.search}`),
  );

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/os/:path*",
    "/finance/:path*",
    "/sports/:path*",
    "/calendar/:path*",
    "/school/:path*",
    "/projects/:path*",
    "/notes/:path*",
    "/music/:path*",
    "/garage/:path*",
    "/clock/:path*",
    "/notifications/:path*",
    "/cosmic-ai/:path*",
    "/ai/:path*",
    "/assistant/:path*",
    "/gmail/:path*",
    "/outlook/:path*",
    "/settings/:path*",
    "/search/:path*",
    "/weather/:path*",
    "/system/:path*",
    "/cosmic-plus/:path*",
    "/api/:path*",
    "/dev/phone-glasses/:path*",
    "/dev/phone-glasses",
  ],
};

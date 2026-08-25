import { NextResponse, type NextRequest } from "next/server";

import { getCurrentCosmicAccount } from "@/services/auth/server";
import { authReturnUrl } from "@/services/auth/returnUrl";

const PUBLIC_API_ROUTES = new Set([
  "/api/account/session", "/api/account/signin", "/api/account/signup", "/api/account/signout",
  "/api/auth/google/callback", "/api/auth/spotify/callback", "/api/billing/webhook",
  "/api/finance/webhooks/plaid", "/api/internal/finance/sync",
]);

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  if (isApi && PUBLIC_API_ROUTES.has(pathname)) return NextResponse.next();
  try {
    if (await getCurrentCosmicAccount(request)) return NextResponse.next();
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

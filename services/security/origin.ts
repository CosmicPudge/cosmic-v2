import "server-only";

export function assertSameOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const requestOrigin = new URL(request.url).origin;
  const expected = process.env.NODE_ENV === "production" && configured ? new URL(configured).origin : requestOrigin;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if ((origin && origin !== expected) || (host && new URL(expected).host !== host)) throw new Response("Cross-origin request denied.", { status: 403 });
}

export function GET() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  if (!publisherId || !/^pub-\d{16}$/.test(publisherId)) return new Response("", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}

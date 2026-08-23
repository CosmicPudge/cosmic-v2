import { f1Constructors, f1Drivers, nascarDrivers } from "@/services/sports/directory";
import { F1Provider } from "@/services/sports/providers/f1";
import { NascarProvider } from "@/services/sports/providers/nascar";

export async function GET(_request: Request, { params }: { params: Promise<{ sport: string; entityType: string; entityId: string }> }) {
  const { sport, entityType, entityId } = await params;
  const directory = sport === "f1" ? (entityType === "driver" ? f1Drivers : f1Constructors) : sport === "nascar" && entityType === "driver" ? nascarDrivers : [];
  const entity = directory.find((entry) => entry.id === entityId);
  if (!entity) return Response.json({ error: "Sports entity was not found." }, { status: 404 });
  const provider = sport === "f1" ? new F1Provider() : sport === "nascar" ? new NascarProvider() : undefined;
  if (!provider) return Response.json({ error: "Unsupported entity sport." }, { status: 400 });
  try {
    const snapshot = await provider.getSnapshot(new Date());
    const standing = snapshot.standings?.find((item) => item.name.toLowerCase() === entity.name.toLowerCase() || item.driver?.toLowerCase() === entity.name.toLowerCase() || item.team?.toLowerCase() === entity.name.toLowerCase());
    return Response.json({ entity, standing, events: snapshot.events.slice(0, 12), lastUpdated: new Date().toISOString() }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
  } catch { return Response.json({ error: "Sports entity data is temporarily unavailable." }, { status: 503 }); }
}

import { DonutTracking } from "@/components/donuts/DonutTracking";
import { isDatabaseConfigured } from "@/services/database/client";
import { findDonutOrderByTrackingToken } from "@/services/donuts/repository";

export default async function DonutTrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  if (token === "demo-order" || !isDatabaseConfigured()) return <DonutTracking token={token} />;
  const order = await findDonutOrderByTrackingToken(token).catch(() => null);
  return <DonutTracking token={token} order={order} />;
}

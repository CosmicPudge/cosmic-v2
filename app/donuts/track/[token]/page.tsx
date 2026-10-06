import { DonutTracking } from "@/components/donuts/DonutTracking";
export default async function DonutTrackingPage({ params }: { params: Promise<{ token: string }> }) { return <DonutTracking token={(await params).token} />; }

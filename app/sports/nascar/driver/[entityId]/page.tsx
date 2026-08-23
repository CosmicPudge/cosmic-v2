import RaceEntityPage from "@/components/apps/sports/RaceEntityPage";

export default async function NascarDriverPage({ params }: { params: Promise<{ entityId: string }> }) { const resolved = await params; return <RaceEntityPage sport="nascar" entityType="driver" entityId={resolved.entityId} />; }

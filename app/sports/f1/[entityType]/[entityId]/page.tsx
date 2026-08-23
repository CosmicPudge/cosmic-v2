import RaceEntityPage from "@/components/apps/sports/RaceEntityPage";

export default async function F1EntityPage({ params }: { params: Promise<{ entityType: string; entityId: string }> }) { const resolved = await params; return <RaceEntityPage sport="f1" entityType={resolved.entityType} entityId={resolved.entityId} />; }

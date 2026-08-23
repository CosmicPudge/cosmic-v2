import TeamPage from "@/components/apps/sports/team/TeamPage";

export default async function SportsTeamPage({ params }: { params: Promise<{ sport: string; teamId: string }> }) {
  const resolved = await params;
  return <TeamPage sport={resolved.sport} teamId={resolved.teamId} />;
}

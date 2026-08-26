import DisplaySetupView from "@/components/account/DisplaySetupView";

export default async function DisplaySetupPage({ searchParams }: { searchParams: Promise<{ deviceId?: string }> }) {
  const params = await searchParams;
  return <DisplaySetupView deviceId={params.deviceId ?? ""} />;
}

import ActivateView from "@/components/account/ActivateView";

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  return <ActivateView initialCode={params.code ?? ""} />;
}

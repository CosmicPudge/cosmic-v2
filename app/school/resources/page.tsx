import SchoolSection from "@/components/school/SchoolSection";

export default async function SchoolResourcesPage({ searchParams }: { searchParams: Promise<{ course?: string | string[]; add?: string | string[] }> }) {
  const query = await searchParams;
  return <SchoolSection section="Resources" requestedCourseId={typeof query.course === "string" ? query.course : undefined} requestedResourceAdd={query.add === "1"} />;
}

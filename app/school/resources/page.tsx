import SchoolSection from "@/components/school/SchoolSection";

export default async function SchoolResourcesPage({ searchParams }: { searchParams: Promise<{ course?: string | string[] }> }) {
  const value = (await searchParams).course;
  return <SchoolSection section="Resources" requestedCourseId={typeof value === "string" ? value : undefined} />;
}

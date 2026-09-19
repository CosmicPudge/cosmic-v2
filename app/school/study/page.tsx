import StudyHome from "@/components/school/StudyHome";
export default async function StudyPage({ searchParams }: { searchParams: Promise<{ course?: string | string[] }> }) {
  const value = (await searchParams).course;
  return <StudyHome requestedCourseId={typeof value === "string" ? value : undefined} />;
}

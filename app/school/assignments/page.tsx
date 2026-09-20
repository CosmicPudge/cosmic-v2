import { AssignmentsWorkloadManager } from "@/components/school/AssignmentsWorkloadManager";

export default async function SchoolAssignmentsPage({ searchParams }: { searchParams: Promise<{ course?: string | string[] }> }) {
  const value = (await searchParams).course;
  return <AssignmentsWorkloadManager requestedCourseId={typeof value === "string" ? value : undefined} />;
}

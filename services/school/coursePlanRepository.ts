import "server-only";
import { getSchoolSnapshotForAccount } from "./server";
import type { CoursePlan } from "./coursePlan";

export async function getSchoolCoursePlan(accountId: string, courseId: string): Promise<CoursePlan | null> {
  const snapshot = await getSchoolSnapshotForAccount(accountId);
  return (snapshot.coursePlans ?? []).find((plan) => plan.courseId === courseId) ?? null;
}

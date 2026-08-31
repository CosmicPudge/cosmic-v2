import "server-only";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { canvasPaginated, canvasRequest, type CanvasProviderError } from "./client";
import { normalizeCanvasAssignment, normalizeCanvasCourse, type CanvasCourseRecord } from "./normalize";
import type { CanvasAssignment, CanvasCourse, CanvasUser } from "./types";

export interface CanvasAcademicData { user: CanvasUser; courses: CanvasCourseRecord[]; assignments: SchoolPlanningAssignment[]; truncated: boolean; }

export class CanvasAcademicProvider {
  constructor(private readonly baseUrl: string, private readonly token: string, private readonly fetchImpl: typeof fetch = fetch) {}

  async validate() { const result = await canvasRequest<CanvasUser>(this.baseUrl, this.token, "users/self", undefined, this.fetchImpl); if (!result.data || typeof result.data.id !== "number") throw new Error("Canvas profile response was invalid."); return result.data; }

  async sync(accountId: string): Promise<CanvasAcademicData> {
    const user = await this.validate();
    const coursesPage = await canvasPaginated<CanvasCourse>(this.baseUrl, this.token, "courses", new URLSearchParams([["enrollment_type", "StudentEnrollment"], ["state[]", "available"], ["per_page", "100"]]), 20, this.fetchImpl);
    const courses = coursesPage.items.map(normalizeCanvasCourse).filter((item): item is CanvasCourseRecord => Boolean(item));
    const assignments: SchoolPlanningAssignment[] = [];
    let truncated = coursesPage.truncated;
    for (const course of courses) {
      const page = await canvasPaginated<CanvasAssignment>(this.baseUrl, this.token, `courses/${encodeURIComponent(course.id)}/assignments`, new URLSearchParams([["include[]", "submission"], ["per_page", "100"]]), 20, this.fetchImpl);
      truncated ||= page.truncated;
      assignments.push(...page.items.map((item) => normalizeCanvasAssignment(accountId, item)).filter((item): item is SchoolPlanningAssignment => Boolean(item)));
    }
    return { user, courses, assignments, truncated };
  }
}

export function canvasErrorStatus(error: unknown) { return (error as CanvasProviderError)?.kind ?? "unavailable"; }

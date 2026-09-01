import type { WorkloadLevel } from "./workload";

export interface DailyBriefing {
  greeting: string;

  headline: string;

  summary: string;

  workload: WorkloadLevel;

  recommendations: string[];

  risks: string[];

  accomplishments: string[];

  // ===== Dashboard =====

  assignmentCompletion: number;

  completedAssignments: number;

  pendingAssignments: number;

  overdueAssignments: number;

  classesToday: number;

  eventsToday: number;

  announcements: number;

  estimatedStudyMinutes: number;

  currentWeek: number;

  notificationCount: number;
  school: { today: string[]; tomorrow: string[]; bring: string[]; wear: string[]; prepare: string[]; officeHours: string[]; suggestedReview: Array<{ value: string; source: string }> };
}

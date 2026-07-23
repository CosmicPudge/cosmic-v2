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
}
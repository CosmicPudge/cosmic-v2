export type CoachPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type CoachInsightType =
  | "warning"
  | "recommendation"
  | "achievement"
  | "schedule"
  | "productivity";

export interface CoachTask {
  id: string;

  title: string;

  description?: string;

  priority: CoachPriority;

  estimatedMinutes: number;

  completed: boolean;

  category:
    | "assignment"
    | "study"
    | "class"
    | "meeting"
    | "break"
    | "personal";

  dueDate?: Date;

  course?: {
    id: string;
    code: string;
    name: string;
    color?: string;
  };
}

export interface CoachInsight {
  id: string;

  type: CoachInsightType;

  title: string;

  message: string;

  priority: CoachPriority;
}

export interface CoachRecommendation {
  title: string;

  reason: string;

  confidence: number;

  estimatedCompletionTime?: string;
}

export interface CoachMission {
  title: string;

  subtitle?: string;

  confidence: number;
}

export interface CoachSummary {
  productivityScore: number;

  tasksRemaining: number;

  estimatedMinutesRemaining: number;

  completedToday: number;

  aiSummary?: string;
}

export interface CoachData {
  summary: CoachSummary;

  mission: CoachMission;

  recommendation: CoachRecommendation;

  insights: CoachInsight[];

  tasks: CoachTask[];
}

export interface CoachState {
  summary: CoachSummary;

  mission: CoachMission;

  recommendation: CoachRecommendation;

  insights: CoachInsight[];

  tasks: CoachTask[];

  criticalTasks: CoachTask[];

  remainingTasks: CoachTask[];

  completedTasks: CoachTask[];

  completionPercentage: number;

  totalRemainingMinutes: number;

  nextTask?: CoachTask;
}
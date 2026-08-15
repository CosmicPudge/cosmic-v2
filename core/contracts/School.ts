export interface SchoolTerm {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  active?: boolean;
}

export interface CourseMeeting {
  weekday: number;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface Course {
  id: string;
  code?: string;
  name: string;
  section?: string;
  instructor?: string;
  credits?: number;
  location?: string;
  color?: string;
  termId: string;
  meetingTimes: CourseMeeting[];
}

export type AssignmentStatus = "upcoming" | "due-soon" | "overdue" | "completed";

export interface Assignment {
  id: string;
  courseId?: string;
  title: string;
  description?: string;
  dueAt?: Date;
  pointsPossible?: number;
  pointsEarned?: number;
  status: AssignmentStatus;
  priority: "low" | "medium" | "high";
  source: "manual" | "canvas-calendar" | "canvas";
}

export interface Grade {
  id?: string;
  courseId: string;
  assignmentId?: string;
  label?: string;
  earnedPoints?: number;
  possiblePoints?: number;
  letter?: string;
}

export interface AcademicGoal {
  id: string;
  title: string;
  target?: string;
  completed: boolean;
  type?: "target-gpa" | "course-grade" | "study-hours" | "assignment-completion" | "custom";
  courseId?: string;
  dueAt?: Date;
}

export interface SchoolResource {
  id: string;
  title: string;
  category: "course" | "university" | "academic" | "afrotc" | "personal";
  url?: string;
  courseId?: string;
  notes?: string;
}

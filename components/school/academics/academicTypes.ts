export type CourseStatus =
  | "not-started"
  | "active"
  | "completed"
  | "withdrawn";

export type LetterGrade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "D-"
  | "F"
  | "N/A";

export type StandingStatus =
  | "excellent"
  | "good"
  | "warning"
  | "critical";

export interface Instructor {
  name: string;
  email?: string;
  office?: string;
}

export interface CourseGrade {
  letter: LetterGrade;

  /**
   * Percentage from 0–100
   */
  percentage: number;

  /**
   * Grade points (4.0 scale)
   */
  points: number;
}

export interface AssignmentSummary {
  completed: number;
  total: number;
  missing: number;
}

export interface Course {
  id: string;

  code: string;

  name: string;

  credits: number;

  color?: string;

  instructor?: Instructor;

  status: CourseStatus;

  grade: CourseGrade;

  assignments: AssignmentSummary;

  attendance?: number;

  nextAssignment?: string;

  nextClass?: string;

  aiInsight?: string;
}

export interface SemesterSummary {
  gpa: number;

  average: number;

  creditsCompleted: number;

  creditsTotal: number;

  standing: StandingStatus;

  scholarshipEligible: boolean;

  totalAssignments: number;

  completedAssignments: number;

  missingAssignments: number;

  aiSummary?: string;
}

export interface AcademicsData {
  semester: SemesterSummary;

  courses: Course[];
}

export interface AcademicsState {
  semester: SemesterSummary;

  courses: Course[];

  highestCourse?: Course;

  lowestCourse?: Course;

  averageGrade: number;

  assignmentCompletion: number;

  creditCompletion: number;
}
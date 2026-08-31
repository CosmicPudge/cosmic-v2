export interface CanvasUser {
  id?: number;
  name?: string;
  short_name?: string;
}

export interface CanvasCourse {
  id?: number;
  name?: string;
  course_code?: string;
  start_at?: string | null;
  end_at?: string | null;
  workflow_state?: string;
  enrollments?: Array<{ type?: string; enrollment_state?: string }>;
  html_url?: string;
}

export interface CanvasSubmission {
  workflow_state?: string;
  submitted_at?: string | null;
  late?: boolean;
  missing?: boolean;
  score?: number | null;
}

export interface CanvasAssignment {
  id?: number;
  name?: string;
  description?: string | null;
  course_id?: number;
  due_at?: string | null;
  unlock_at?: string | null;
  lock_at?: string | null;
  points_possible?: number | null;
  published?: boolean;
  html_url?: string;
  updated_at?: string | null;
  submission?: CanvasSubmission | null;
}

export interface CanvasPage<T> { items: T[]; truncated: boolean; }

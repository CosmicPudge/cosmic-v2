export type CadetStatus =
  | "active"
  | "probation"
  | "inactive"
  | "completed";

export type UniformType =
  | "ABU"
  | "OCP"
  | "Service Dress"
  | "Blues"
  | "PT Gear"
  | "Civilian";

export type EventType =
  | "llab"
  | "pt"
  | "class"
  | "inspection"
  | "meeting"
  | "ceremony"
  | "other";

export type ReadinessStatus =
  | "complete"
  | "attention"
  | "missing";

export interface AFROTCCadet {
  id: string;
  firstName: string;
  lastName: string;

  rank?: string;

  status: CadetStatus;

  detachment: string;
  squadron: string;
  flight: string;

  academicYear: string;
  semester: string;
}

export interface UniformItem {
  id: string;

  name: string;

  required: boolean;

  packed: boolean;
}

export interface Uniform {
  type: UniformType;

  notes?: string;

  items: UniformItem[];
}

export interface PTScore {
  pushUps: number;
  sitUps: number;
  runTime: string;

  goalPushUps: number;
  goalSitUps: number;
  goalRunTime: string;
}

export interface AFROTCEvent {
  id: string;

  title: string;

  description?: string;

  type: EventType;

  start: Date;
  end: Date;

  location?: string;

  required: boolean;
}

export interface ReadinessItem {
  id: string;

  title: string;

  description?: string;

  status: ReadinessStatus;
}

export interface ReadinessSummary {
  score: number;

  completed: number;

  total: number;
}

export interface AFROTCData {
  cadet: AFROTCCadet;

  uniform: Uniform;

  pt: PTScore;

  events: AFROTCEvent[];

  readiness: ReadinessItem[];
}

export interface AFROTCState {
  cadet: AFROTCCadet;

  uniform: Uniform;

  pt: PTScore;

  nextEvent?: AFROTCEvent;

  upcomingEvents: AFROTCEvent[];

  readiness: ReadinessItem[];

  readinessSummary: ReadinessSummary;
}
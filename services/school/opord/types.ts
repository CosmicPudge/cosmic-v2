export type OpordFieldStatus = "explicit" | "unknown" | "conflicting";

export type OpordField<T> =
  | { status: "explicit"; value: T; excerpt?: string }
  | { status: "unknown"; value: null; excerpt?: string }
  | { status: "conflicting"; values: T[]; excerpt?: string };

export interface OpordDeadline {
  action: string;
  qualifier: "NLT" | "NET" | "unspecified";
  time: string | null;
  raw: string;
}

export interface OpordEvent {
  id: string;
  title: string;
  date: OpordField<string>;
  reportTime: OpordField<string>;
  reportQualifier: OpordField<"NLT" | "NET" | "unspecified">;
  startTime: OpordField<string>;
  endTime: OpordField<string>;
  location: OpordField<string>;
  uniform: OpordField<string>;
  bring: string[];
  instructions: string[];
  deadlines: OpordDeadline[];
  status: "scheduled" | "cancelled" | "unknown";
  sourceId: string;
  sourceName: string;
  provenance: { sourceName: string; excerpt: string };
}

export interface OpordDocument {
  documentKind: "afrotc_opord";
  sourceId: string;
  sourceName: string;
  opordNumber: OpordField<string>;
  title: OpordField<string>;
  organization: OpordField<string>;
  effectiveDate: OpordField<string>;
  publicationDate: OpordField<string>;
  eventDateRange: OpordField<string>;
  purpose: OpordField<string>;
  events: OpordEvent[];
  parsedAt: string;
}

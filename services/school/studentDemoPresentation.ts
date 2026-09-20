import type { SchoolCourseIdentity } from "./courseIdentity";

export const schoolBrandLabel = "Cosmic School";

export const schoolNavigationGroups = {
  primary: [
    { href: "/school", label: "Today" },
    { href: "/school/courses", label: "Courses" },
    { href: "/school/assignments", label: "Assignments" },
    { href: "/school/calendar", label: "Calendar" },
    { href: "/school/study", label: "Study" },
    { href: "/school/resources", label: "Resources" },
  ],
  secondary: [
    { href: "/school/notes", label: "Notes" },
    { href: "/school/grades", label: "Grades" },
    { href: "/school/goals", label: "Goals" },
    { href: "/school/inbox", label: "Inbox" },
    { href: "/school/week", label: "This Week" },
    { href: "/school/schedule", label: "Schedule" },
    { href: "/school/sources", label: "Sources" },
  ],
  specialized: [
    { href: "/school/afrotc", label: "AFROTC" },
    { href: "/school/opords", label: "OPORDs" },
  ],
} as const;

export function isSchoolNavigationActive(pathname: string, href: string) {
  return pathname === href || (href !== "/school" && pathname.startsWith(`${href}/`));
}

export function schoolCalendarItemHref(input: {
  kind: "CLASS" | "DUE" | "EVENT";
  id: string;
  courseId?: string;
}, assignmentIds: string[], catalog: SchoolCourseIdentity[]): string | undefined {
  if (input.kind === "DUE") {
    return assignmentIds.filter((id) => id === input.id).length === 1
      ? `/school/assignments/${encodeURIComponent(input.id)}`
      : undefined;
  }

  if (!input.courseId) return undefined;
  const identities = catalog.filter((course) => course.id === input.courseId);
  const identity = identities[0];
  if (identities.length !== 1 || !identity || identity.matchStatus === "ambiguous") return undefined;
  return `/school/courses/${encodeURIComponent(identity.id)}`;
}

export const schoolCourseDeletionWarning =
  "This removes the local course, its meetings, assignments, grades, and resources. Notes, study sets, and goals are kept, but may become unassociated from this course. Canvas-derived data is not changed.";

export const schoolSectionDescriptions = {
  Resources: "Course materials you save for quick access, separate from imported source documents.",
  Sources: "Imported school documents and evidence used to support extracted findings. Course Resources are managed separately.",
} as const;

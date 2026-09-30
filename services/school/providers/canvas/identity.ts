export interface CanvasAssignmentIdentityInput {
  userId: string;
  sourceType?: string | null;
  sourceId?: string | null;
  externalId?: string | null;
}

/** Stable import identity; title and dates are deliberately excluded. */
export function canvasAssignmentIdentity(input: CanvasAssignmentIdentityInput) {
  return `${input.userId}:${input.sourceType ?? "canvas-api"}:${input.sourceId ?? ""}:${input.externalId ?? ""}`;
}

export function dedupeCanvasAssignmentRows<T extends CanvasAssignmentIdentityInput>(rows: T[]) {
  const result = new Map<string, T>();
  for (const row of rows) result.set(canvasAssignmentIdentity(row), row);
  return [...result.values()];
}

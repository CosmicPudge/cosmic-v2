// Temporary product gate: set this to true to re-enable School AI generation.
export const SCHOOL_AI_ENABLED = false;

export const schoolCapabilities = {
  aiIntelligence: SCHOOL_AI_ENABLED,
  transcriptAI: SCHOOL_AI_ENABLED,
} as const;

import "server-only";
import type { SchoolAIProviderResult, SchoolAIRequestOptions, SchoolAssignmentInterpretationInput } from "@/core/contracts/SchoolAI";

export interface SchoolAIProvider {
  readonly id: string;
  readonly model?: string;
  interpretAssignment(input: SchoolAssignmentInterpretationInput, options?: SchoolAIRequestOptions): Promise<SchoolAIProviderResult>;
}

import "server-only";
import type { SchoolAIProviderResult, SchoolAssignmentInterpretationInput } from "@/core/contracts/SchoolAI";
import type { SchoolAIProvider } from "./provider";
import { SchoolAIError } from "./errors";

export type SchoolAIMockMode = "valid" | "malformed" | "timeout" | "unavailable" | "safety-refusal";

export class DeterministicSchoolAIProvider implements SchoolAIProvider {
  readonly id = "mock";
  readonly model = "deterministic-school-test";
  private readonly mode: SchoolAIMockMode;

  constructor(mode: SchoolAIMockMode = "valid") { this.mode = mode; }

  async interpretAssignment(input: SchoolAssignmentInterpretationInput): Promise<SchoolAIProviderResult> {
    if (this.mode === "timeout") throw new DOMException("Mock timeout", "TimeoutError");
    if (this.mode === "unavailable") throw new SchoolAIError("PROVIDER_UNAVAILABLE", "School AI provider is temporarily unavailable.", { retryable: true, providerId: this.id, modelId: this.model });
    if (this.mode === "safety-refusal") throw new SchoolAIError("SAFETY_REFUSAL", "School AI declined this interpretation.", { providerId: this.id, modelId: this.model });
    if (this.mode === "malformed") return { candidate: { requirements: "not-an-array" }, providerId: this.id, modelId: this.model, responseStatus: "ok", warnings: [] };
    return {
      candidate: {
        summary: `Interpretation for ${input.title}`,
        requirements: [{ id: "mock-requirement", text: "Review the assignment instructions.", kind: "task" }],
        deliverables: [],
        suggestedSteps: [{ id: "mock-step", text: "Review the instructions.", order: 0 }],
        studyTopics: [],
        ambiguities: [],
        warnings: [],
        confidence: 0.5,
        source: "ai",
      },
      providerId: this.id,
      modelId: this.model,
      responseStatus: "ok",
      warnings: [],
    };
  }
}

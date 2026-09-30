import "server-only";
import { DeterministicSchoolAIProvider } from "./mockProvider";
import type { SchoolAIProvider } from "./provider";

const supportedTestProviders = new Set(["mock"]);

/** Server-only selection. Production has no School provider until a later phase registers one. */
export function getSchoolAIProvider(): SchoolAIProvider | undefined {
  const selected = process.env.SCHOOL_AI_PROVIDER?.trim().toLowerCase();
  if (process.env.NODE_ENV === "test" && selected === "mock") return new DeterministicSchoolAIProvider();
  return undefined;
}

export function isSupportedSchoolAIProvider(value: string | undefined): boolean {
  return Boolean(value && supportedTestProviders.has(value.trim().toLowerCase()));
}

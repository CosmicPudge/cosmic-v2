"use client";

import { useState } from "react";
import type { SchoolAssignmentIntelligence, SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { toSchoolAssignmentInterpretationInput } from "@/core/contracts/SchoolAI";

export function AssignmentAnalysisAction({ assignment, enabled, onComplete }: { assignment: SchoolPlanningAssignment; enabled: boolean; onComplete: (intelligence: SchoolAssignmentIntelligence) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  if (!enabled) return <p className="text-xs text-white/40">Assignment analysis is currently unavailable.</p>;
  async function analyze() {
    setBusy(true); setError(undefined);
    try {
      const response = await fetch(`/api/school/assignments/${encodeURIComponent(assignment.id)}/interpret`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: toSchoolAssignmentInterpretationInput(assignment) }) });
      const body = await response.json() as { intelligence?: SchoolAssignmentIntelligence; message?: string; error?: string };
      if (!response.ok || !body.intelligence) throw new Error(body.message ?? body.error ?? "Analysis could not be completed.");
      onComplete(body.intelligence);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis could not be completed. Your assignment is safe.");
    } finally { setBusy(false); }
  }
  return <div className="space-y-2"><button type="button" onClick={analyze} disabled={busy} className="rounded-xl border border-sky-200/20 bg-sky-200/10 px-3 py-2 text-sm text-sky-50 transition hover:bg-sky-200/20 disabled:cursor-wait disabled:opacity-50">{busy ? "Analyzing…" : "Analyze assignment"}</button>{error && <p role="alert" className="text-xs text-amber-200/80">{error}</p>}</div>;
}

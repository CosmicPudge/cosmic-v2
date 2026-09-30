import type { SchoolAssignmentIntelligence } from "@/core/contracts/SchoolPlanning";

export function AssignmentIntelligencePanel({ intelligence }: { intelligence: SchoolAssignmentIntelligence }) {
  const hasContent = Boolean(intelligence.summary || intelligence.requirements.length || intelligence.deliverables.length || intelligence.suggestedSteps.length || intelligence.studyTopics.length || intelligence.ambiguities.length || intelligence.warnings.length || intelligence.estimatedMinutes);
  if (!hasContent) return null;
  return <section className="space-y-5 rounded-[1.35rem] border border-sky-200/10 bg-sky-200/[0.04] p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">Assignment intelligence</p>{intelligence.summary && <p className="mt-3 text-sm leading-7 text-white/70">{intelligence.summary}</p>}</div>{intelligence.requirements.length > 0 && <IntelligenceList title="Requirements" items={intelligence.requirements.map((item) => `${item.text}${item.completed ? " · Complete" : ""}`)} />}{intelligence.deliverables.length > 0 && <IntelligenceList title="Deliverables" items={intelligence.deliverables.map((item) => item.format ? `${item.text} · ${item.format}` : item.text)} />}{intelligence.suggestedSteps.length > 0 && <IntelligenceList title="Suggested steps" ordered items={intelligence.suggestedSteps.map((item) => intelligenceStep(item.text, item.estimatedMinutes))} />}{intelligence.studyTopics.length > 0 && <IntelligenceList title="Study topics" items={intelligence.studyTopics} />}{intelligence.ambiguities.length > 0 && <IntelligenceList title="Ambiguities" tone="amber" items={intelligence.ambiguities.map((item) => item.text)} />}{intelligence.warnings.length > 0 && <IntelligenceList title="Warnings" tone="amber" items={intelligence.warnings.map((item) => item.text)} />}{intelligence.estimatedMinutes && <p className="border-t border-white/[0.08] pt-4 text-xs text-white/45">Interpreted effort: {intelligence.estimatedMinutes} minutes{intelligence.effortCategory ? ` · ${intelligence.effortCategory}` : ""}</p>}</section>;
}

function intelligenceStep(text: string, minutes?: number) { return minutes ? `${text} · ${minutes} min` : text; }

function IntelligenceList({ title, items, ordered = false, tone = "normal" }: { title: string; items: string[]; ordered?: boolean; tone?: "normal" | "amber" }) {
  const List = ordered ? "ol" : "ul";
  return <div><p className={`text-xs font-semibold uppercase tracking-[0.16em] ${tone === "amber" ? "text-amber-200/65" : "text-white/45"}`}>{title}</p><List className="mt-2 space-y-2 pl-5 text-sm leading-6 text-white/65">{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</List></div>;
}

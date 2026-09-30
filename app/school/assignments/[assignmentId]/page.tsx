"use client";

import Link from "next/link";
import { ArrowLeft, CalendarClock, ExternalLink } from "lucide-react";
import { use, useState } from "react";
import type { SchoolAssignmentIntelligence } from "@/core/contracts/SchoolPlanning";
import { SCHOOL_AI_ENABLED } from "@/services/school/capabilities";
import { useSchool } from "@/components/school/context/SchoolDataContext";
import { AssignmentPlanningEditor } from "@/components/school/AssignmentPlanningEditor";
import { AssignmentIntelligencePanel } from "@/components/school/AssignmentIntelligencePanel";
import { AssignmentAnalysisAction } from "@/components/school/AssignmentAnalysisAction";
import { formatEstimatedMinutes, isSafeProviderUrl } from "@/services/school/planningFormat";
import { safeSchoolDate } from "@/services/school/planning";
import { assignmentDetailCourseHref, resolveAssignmentDetail } from "@/services/school/assignmentDetail";
import { sanitizeCanvasHtml } from "@/services/school/providers/canvas/normalize";

export default function AssignmentDetailPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params);
  const { snapshot, local, loading } = useSchool();
  const [analysis, setAnalysis] = useState<{ id: string; intelligence: SchoolAssignmentIntelligence }>();
  const resolution = resolveAssignmentDetail({ assignmentId, localReady: local.ready, providerLoading: loading, localAssignments: local.data.assignments, courses: local.data.courses, terms: local.data.terms, providerCourses: snapshot?.canvasCourses ?? [], providerAssignments: snapshot?.planningAssignments ?? [] });
  if (resolution.state === "loading") return <p role="status" className="py-16 text-sm text-white/50">Loading assignment…</p>;
  if (resolution.state === "not-found") return <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60"><p>Assignment not found in the current School data.</p><Link href="/school/assignments" className="mt-4 inline-block text-sky-100/80">← Back to assignments</Link></div>;
  const { assignment: item, courseIdentity } = resolution;
  const intelligence = analysis?.id === item.id ? analysis.intelligence : item.intelligence;
  const intelligenceStale = Boolean(intelligence?.generatedAt && (item.sourceUpdatedAt ?? item.updatedAt).getTime() > Date.parse(intelligence.generatedAt) + 1_000);
  const status = item.completionStatus.replaceAll("_", " ");
  const dueAt = safeSchoolDate(item.dueAt);
  const descriptionHtml = item.providerMetadata?.canvas?.descriptionHtml ? sanitizeCanvasHtml(item.providerMetadata.canvas.descriptionHtml) : undefined;
  const courseLabel = courseIdentity
    ? <Link href={assignmentDetailCourseHref(courseIdentity)} className="hover:text-sky-100">{courseIdentity.code ? `${courseIdentity.code} · ` : ""}{courseIdentity.name}</Link>
    : item.courseId || item.courseName ? item.courseName ?? "Unmatched course" : "No course linked";
  function handleAnalysis(next: SchoolAssignmentIntelligence) {
    setAnalysis({ id: item.id, intelligence: next });
    if (item.sourceType === "manual") {
      const localItem = local.data.assignments.find((assignment) => `manual:${assignment.id}` === item.id);
      if (localItem) local.saveAssignment({ ...localItem, intelligence: next });
    }
  }
  return <div className="max-w-3xl space-y-5"><Link href="/school/assignments" className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"><ArrowLeft className="size-4" /> Assignment manager</Link><header><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/55">{courseLabel}</p><h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-white">{item.title}</h1></div>{isSafeProviderUrl(item.canvasUrl) && <a href={item.canvasUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-sky-200/20 bg-sky-200/10 px-3 py-2 text-sm text-sky-50 transition hover:bg-sky-200/20 focus:outline-none focus:ring-2 focus:ring-sky-200/50">Open in Canvas <ExternalLink className="size-4" /></a>}</div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 capitalize text-white/65">{status}</span><span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-white/65">{item.sourceType === "school-source" ? "School Source" : item.sourceType === "canvas-api" ? "Canvas" : item.sourceType === "canvas-calendar" ? "Canvas Calendar" : "Cosmic"}</span></div></header><section className="grid gap-3 sm:grid-cols-3"><Info icon={<CalendarClock />} label="Due" value={dueAt ? dueAt.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }) : "No due date"} /><Info label="Cosmic priority" value={item.priority} /><Info label="Estimated time" value={formatEstimatedMinutes(item.estimatedMinutes)} /></section><section className="rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">Assignment interpretation</p><p className="mt-2 text-sm text-white/55">One explicit action sends only this assignment’s approved fields for interpretation.</p></div><AssignmentAnalysisAction assignment={item} enabled={SCHOOL_AI_ENABLED} onComplete={handleAnalysis} /></div>{intelligenceStale && <p className="mt-3 text-xs text-amber-200/75">This interpretation may be out of date because the assignment changed. Analyze again to refresh it.</p>}</section>{intelligence && <AssignmentIntelligencePanel intelligence={intelligence} />}<section className="space-y-4 rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">Description</p>{descriptionHtml ? <div className="prose prose-invert mt-3 max-w-none text-sm leading-7 text-white/65" dangerouslySetInnerHTML={{ __html: descriptionHtml }} /> : <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/65">{item.description ?? "No description provided by the source."}</p>}</div><div className="border-t border-white/[0.08] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/55">Source</p><p className="mt-2 text-sm text-white/60">This assignment came from {item.sourceType === "school-source" ? "a School Source" : item.sourceType === "canvas-api" ? "Canvas Academic API" : item.sourceType === "canvas-calendar" ? "Canvas Calendar" : "a manual Cosmic entry"}.</p>{item.provenance?.map((source, index) => <p key={`${source.sourceType}-${index}`} className="mt-2 text-xs text-white/40">{source.evidence ?? source.sourceType}{source.externalId ? ` · ${source.externalId}` : ""}</p>)}</div></section>{item.sourceType !== "manual" && <AssignmentPlanningEditor key={item.id} assignment={item} />}</div>;
}

function Info({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) { return <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"><span className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/35">{icon} {label}</span><p className="mt-2 text-sm capitalize text-white/75">{value}</p></div>; }

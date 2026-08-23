import AppShell from "@/components/os/app/AppShell";
import SupportReportForm from "@/components/support/SupportReportForm";
import { Suspense } from "react";
export default function ReportPage() { return <AppShell><main className="mx-auto max-w-3xl space-y-5 p-6 text-white"><p className="text-xs uppercase tracking-[0.2em] text-cyan-100/50">Cosmic support</p><h1 className="text-3xl font-semibold">Report a bug or share feedback</h1><p className="text-sm text-white/50">You must be signed in to submit a report.</p><Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">Loading report form…</div>}><SupportReportForm /></Suspense></main></AppShell> }

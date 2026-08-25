import "server-only";

import { completeFinanceSyncJob, claimFinanceSyncJob, failFinanceSyncJob, getFinanceConnection, listClaimableFinanceSyncJobs, setFinanceConnectionStatus } from "./connectedStore";
import { financeProviderErrorCategory, syncFinanceConnection } from "./sync";

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 15 * 60_000;

export function retryDelayMs(attempt: number) { const exponential = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * (2 ** Math.max(0, attempt - 1))); const jitter = Math.floor(exponential * 0.2 * Math.random()); return exponential + jitter; }
export function isRetryableFinanceError(category: string) { return ["provider_unavailable", "provider_timeout", "rate_limited", "sync_delayed", "temporary_error"].includes(category); }

async function processClaimedJob(job: Awaited<ReturnType<typeof claimFinanceSyncJob>>) {
  if (!job) return { status: "lost_claim" as const };
  const started = Date.now();
  try {
    const connection = await getFinanceConnection(job.userId, job.connectionId);
    if (!connection || connection.status === "disconnected") { await failFinanceSyncJob(job.id, "connection_disconnected", false); return { status: "cancelled" as const }; }
    await syncFinanceConnection(job.userId, job.connectionId, true);
    await completeFinanceSyncJob(job.id);
    console.info("finance_sync_job", { jobId: job.id, connectionId: job.connectionId, provider: connection.provider, operation: "sync", durationMs: Date.now() - started, attempt: job.attempts, outcome: "completed" });
    return { status: "completed" as const };
  } catch (error) {
    const category = financeProviderErrorCategory(error);
    const retry = isRetryableFinanceError(category) && job.attempts < MAX_ATTEMPTS;
    const nextAttemptAt = retry ? new Date(Date.now() + retryDelayMs(job.attempts)) : undefined;
    await failFinanceSyncJob(job.id, category, retry, nextAttemptAt);
    await setFinanceConnectionStatus(job.userId, job.connectionId, retry ? { status: "provider_unavailable", errorCategory: category } : category === "reconnect_required" ? { status: "reconnect_required", reconnectRequired: true, errorCategory: category } : { status: "needs_attention", errorCategory: category });
    console.warn("finance_sync_job", { jobId: job.id, connectionId: job.connectionId, operation: "sync", durationMs: Date.now() - started, attempt: job.attempts, outcome: retry ? "retry" : "failed", errorCategory: category });
    return { status: retry ? "retry" as const : "failed" as const, category };
  }
}

export async function processFinanceSyncBatch(limit = 3) {
  const candidates = await listClaimableFinanceSyncJobs(limit);
  const results: Array<{ id: string; status: string; category?: string }> = [];
  for (const candidate of candidates) { const claimed = await claimFinanceSyncJob(candidate.id); if (!claimed) continue; const result = await processClaimedJob(claimed); results.push({ id: claimed.id, ...result }); }
  return { examined: candidates.length, processed: results.length, results };
}

import type { ConnectedFinanceAccount, ConnectedFinanceTransaction } from "./merged";

export type ConnectedFinanceReadModel = { accounts: ConnectedFinanceAccount[]; transactions: ConnectedFinanceTransaction[]; duplicateCandidates?: FinanceDuplicateCandidate[] };
export type FinanceDuplicateCandidate = { accountId: string; connectionId: string; provider: string; institutionName?: string | null; mask?: string | null; type: string };
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type Listener = () => void;

export class FinanceReadModelCoordinator {
  private readonly inFlight = new Map<string, Promise<ConnectedFinanceReadModel>>();
  private readonly listeners = new Map<string, Set<Listener>>();

  load(scopeId: string, limit: number, fetcher: Fetcher = fetch): Promise<ConnectedFinanceReadModel> {
    const key = `${scopeId}:${limit}`;
    const existing = this.inFlight.get(key);
    if (existing) return existing;
    const request = fetcher(`/api/finance/connected-data?limit=${limit}`, { cache: "no-store" })
      .then(async (response) => response.ok ? await response.json() as ConnectedFinanceReadModel : { accounts: [], transactions: [], duplicateCandidates: [] })
      .catch(() => ({ accounts: [], transactions: [], duplicateCandidates: [] }))
      .finally(() => { if (this.inFlight.get(key) === request) this.inFlight.delete(key); });
    this.inFlight.set(key, request);
    return request;
  }

  subscribe(scopeId: string, limit: number, listener: Listener) {
    const key = `${scopeId}:${limit}`;
    const listeners = this.listeners.get(key) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(key, listeners);
    return () => { listeners.delete(listener); if (!listeners.size) this.listeners.delete(key); };
  }

  invalidate(scopeId?: string) {
    for (const [key, listeners] of this.listeners) {
      if (scopeId && !key.startsWith(`${scopeId}:`)) continue;
      for (const listener of listeners) listener();
    }
  }

  clearScope(scopeId: string) {
    for (const key of this.inFlight.keys()) if (key.startsWith(`${scopeId}:`)) this.inFlight.delete(key);
    for (const key of this.listeners.keys()) if (key.startsWith(`${scopeId}:`)) this.listeners.delete(key);
  }
}

export const financeReadModel = new FinanceReadModelCoordinator();

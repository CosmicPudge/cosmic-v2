"use client";

import { useCallback, useEffect, useState } from "react";
import { useCosmicScope } from "@/services/storage/scope";
import type { ConnectedFinanceAccount, ConnectedFinanceTransaction } from "@/services/finance/merged";
import { financeReadModel, type FinanceDuplicateCandidate } from "@/services/finance/readModel";

export function useConnectedFinanceData(limit = 200) {
  const scope = useCosmicScope();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<{ scopeId?: string; loading: boolean; accounts: ConnectedFinanceAccount[]; transactions: ConnectedFinanceTransaction[]; duplicateCandidates: FinanceDuplicateCandidate[] }>({ loading: true, accounts: [], transactions: [], duplicateCandidates: [] });

  useEffect(() => {
    let active = true;
    void financeReadModel.load(scope.id, limit)
      .then((body) => { if (active) setState({ scopeId: scope.id, loading: false, accounts: body.accounts ?? [], transactions: body.transactions ?? [], duplicateCandidates: body.duplicateCandidates ?? [] }); })
      .catch(() => { if (active) setState({ scopeId: scope.id, loading: false, accounts: [], transactions: [], duplicateCandidates: [] }); });
    const unsubscribe = financeReadModel.subscribe(scope.id, limit, () => setRefreshVersion((version) => version + 1));
    return () => { active = false; unsubscribe(); };
  }, [limit, scope.id, refreshVersion]);

  const refresh = useCallback(() => financeReadModel.invalidate(scope.id), [scope.id]);
  return { loading: state.loading || state.scopeId !== scope.id, accounts: state.scopeId === scope.id ? state.accounts : [], transactions: state.scopeId === scope.id ? state.transactions : [], duplicateCandidates: state.scopeId === scope.id ? state.duplicateCandidates : [], refresh };
}

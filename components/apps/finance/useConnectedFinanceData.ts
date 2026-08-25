"use client";

import { useEffect, useState } from "react";
import { useCosmicScope } from "@/services/storage/scope";
import type { ConnectedFinanceAccount, ConnectedFinanceTransaction } from "@/services/finance/merged";

type ResponseBody = { accounts?: ConnectedFinanceAccount[]; transactions?: ConnectedFinanceTransaction[] };

export function useConnectedFinanceData(limit = 200) {
  const scope = useCosmicScope();
  const [state, setState] = useState<{ scopeId?: string; loading: boolean; accounts: ConnectedFinanceAccount[]; transactions: ConnectedFinanceTransaction[] }>({ loading: true, accounts: [], transactions: [] });

  useEffect(() => {
    let active = true;
    void fetch(`/api/finance/connected-data?limit=${limit}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<ResponseBody> : { accounts: [], transactions: [] })
      .then((body) => { if (active) setState({ scopeId: scope.id, loading: false, accounts: body.accounts ?? [], transactions: body.transactions ?? [] }); })
      .catch(() => { if (active) setState({ scopeId: scope.id, loading: false, accounts: [], transactions: [] }); });
    return () => { active = false; };
  }, [limit, scope.id]);

  return { loading: state.loading || state.scopeId !== scope.id, accounts: state.scopeId === scope.id ? state.accounts : [], transactions: state.scopeId === scope.id ? state.transactions : [] };
}

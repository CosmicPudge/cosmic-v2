# Connected Finance provider decision

Research checked August 23, 2026 against official provider documentation.

| Provider | Coverage | Transactions | Balances | Recurring | Sandbox | Production model | Cost considerations | Cosmic suitability |
|---|---|---|---|---|---|---|---|---|
| Plaid | Strong US coverage; OAuth support is required for many US institutions | `/transactions/sync`, added/modified/removed changes, up to 24 months where available | Accounts and Balance products | Optional recurring transaction product | Free Sandbox institutions and webhook simulation | Limited Production/Trial access may be available; full access requires Plaid approval | Plaid says Transactions is subscription-priced, Refresh is per-request, and exact pricing depends on product/agreement | Best first provider for Cosmic because the Link flow, Node-compatible API, OAuth path, incremental sync, webhooks, and Sandbox are well documented |
| MX | Strong US/Canada aggregation and OAuth/data-access coverage | Normalized and categorized transaction APIs with pagination | Account and balance data | Transaction classifiers include subscription/direct-deposit flags | Developer environment and Sandbox access are available through MX | Commercial onboarding/API-key process | Public pages do not publish a dependable universal production price; sales/API-key process applies | Strong alternative if coverage/reliability or enrichment requirements outweigh Plaid's faster initial implementation |
| Mastercard Open Finance / Finicity | Enterprise open-banking and verification ecosystem | Account/transaction capabilities depend on product and partner agreement | Account and verification capabilities | Not treated as a first-class guaranteed capability in this phase | Sandbox materials exist | Enterprise onboarding and commercial agreement | Public pricing and product limits are not sufficiently transparent for a Free-tier decision | Credible later enterprise option, but not the best first implementation for this product stage |

Sources: [Plaid Transactions](https://plaid.com/docs/transactions/), [Plaid Transactions webhooks](https://plaid.com/docs/transactions/webhooks/), [Plaid OAuth](https://plaid.com/docs/link/oauth/), [Plaid pricing](https://plaid.com/pricing/), [Plaid billing](https://plaid.com/docs/account/billing/), [MX transactions](https://docs.mx.com/api-reference/nexus/reference/transactions-overview), [MX account aggregation](https://www.mx.com/products/account-aggregation/), [MX developer environment](https://dashboard.mx.com/sign_up), [Mastercard Open Banking sandbox](https://static.developer.mastercard.com/content/open-banking-connect/Documents/OB_Connect_API_Sandbox_Scenarios_1-25-0_v1-0.pdf).

## Selected provider

Plaid is the first provider adapter. It is not hard-coded into Finance contracts: `FinancialDataProvider` owns the connection, account, balance, transaction-sync, and disconnect capabilities, while `PlaidFinancialProvider` translates Plaid's API into that interface.

Plaid was selected because Cosmic can test the complete Link and transaction-sync lifecycle in Sandbox without collecting credentials, Plaid documents OAuth and webhook verification, and `/transactions/sync` directly models idempotent added/modified/removed updates. MX remains the strongest follow-on adapter candidate for US/Canada coverage and enrichment.

## Current implementation boundary

Implemented:

- Server-created Link tokens.
- Official Plaid Link browser flow loaded from Plaid's supported web distribution.
- Public-token exchange on the server.
- AES-256-GCM encrypted provider credential storage using the existing `provider_credentials` boundary.
- Account-owned connection, external account, external transaction, and sync-state tables.
- Plaid account/balance import.
- Incremental `/transactions/sync` with cursor persistence and bounded pagination.
- Added, modified, removed, duplicate-safe, and pending transaction handling.
- Plaid webhook signature verification using the `Plaid-Verification` JWT and body hash.
- Webhook-triggered server-side sync, durable cooldowns, reconnect status, and provider revocation on disconnect/account deletion.
- Safe Finance connection UI and `/dev/finance` diagnostics.
- Central provider registry with priority, capabilities, health/configuration state, and `/dev/finance/providers` discovery diagnostics.
- Provider-neutral institution search boundary; Plaid is the only currently callable configured adapter.
- CSV import fallback with destination-account selection, generic column mapping, preview, duplicate review, row limits, and imported transaction source tagging.

Manual Finance remains the source of truth for the existing local snapshot. Connected records are stored separately and displayed as normalized provider-backed data; S2.1 now merges those records into cash flow, categories, budgets, and recurring analysis without putting provider tokens or raw payloads into the local snapshot. MX and Finicity are registered as configured-disabled descriptors until their current commercial/developer onboarding is completed; no undocumented API calls are made.

## Multi-provider boundary

The registry priority is Plaid, MX, Mastercard Open Finance / Finicity, then manual/CSV. Existing connections remain tied to their provider and environment. Provider fallback is a connection-discovery decision only; Cosmic never silently migrates an established connection.

MX’s official API documents institution search, account/balance data, paginated transactions, enrichment options, OAuth/member flows, and webhooks, but access requires MX developer/API onboarding. Mastercard’s official Open Finance US materials identify Finicity as the US provider and the Mastercard sandbox documentation exposes account/transaction scenarios; production access is enterprise/onboarding dependent. These providers are therefore architecture-ready but not claimed as live Cosmic adapters.

## CSV fallback

Finance exposes a generic CSV import path for `Date, Description, Amount` and `Date, Description, Debit, Credit` exports. The importer caps files at 5 MB and previews at 500 rows, requires a destination account, maps optional categories, marks imported records with `source: "import"`, and asks for confirmation when likely duplicates match account/date/amount/description. CSV contents are parsed locally in the browser and are not sent to providers or AI services.

## Plaid setup

1. Create a Plaid Dashboard account and select the Sandbox environment.
2. Copy Sandbox `client_id` and `secret` into server-only `.env.local` values.
3. Generate a 32-byte random key and base64-encode it for `COSMIC_CREDENTIAL_ENCRYPTION_KEY`.
4. Set `PLAID_ENV=sandbox` and run the new Drizzle migration before opening Finance.
5. Use `PLAID_WEBHOOK_URL=https://cosmicpudge.shop/api/finance/webhooks/plaid` for the canonical production endpoint. For local Sandbox testing, use a reachable HTTPS tunnel URL instead.
6. Configure `PLAID_REDIRECT_URI` only when testing OAuth institutions and register the exact URI in Plaid. Do not add query parameters to the redirect URI.
7. Run the app, sign in, open Finance, and select `+ Connect financial account`.
8. Complete Link with a Plaid Sandbox institution, then allow the initial sync to finish.
9. Use Plaid Sandbox webhook tools to trigger transaction updates, then verify `/transactions/sync` changes are applied without duplicates.
10. Before live use, request Plaid Production access, complete OAuth/Launch Center requirements, confirm the commercial pricing agreement, and set production secrets separately from Sandbox secrets.

## Free-tier economics

No connection limit is enforced yet. Plaid's public pricing states that production pricing varies by product and agreement; Transactions is subscription-priced and Refresh is per-request. A final Free/Plus connection limit must therefore wait for Cosmic's actual Plaid quote and expected connected-item volume. The current safe recommendation is to launch Sandbox first, then start limited live access with a deliberately small per-account Item cap after cost approval rather than promise unlimited Free linking.

## Security decisions

- Provider access tokens are never returned to client routes, localStorage, browser state, URL parameters, exports, or generic Finance sync snapshots.
- Browser mutations require the existing same-origin check and authenticated session.
- Every Finance query derives `userId` from the authenticated session; browser-provided ownership is ignored.
- Webhooks do not use browser Origin checks. They use Plaid's signed verification header, five-minute replay window, JWK verification, and raw-body SHA-256 validation.
- Logs and diagnostics expose only counts, states, environment, and timestamps.
- Disconnect revokes provider access where supported, cancels queued sync jobs, removes encrypted credentials, marks the Finance connection disconnected, and preserves normalized history.

## Durable sync engine

Provider webhooks only verify the event, update connection state, enqueue/coalesce a job, and return quickly. `/api/internal/finance/sync` is a Vercel Cron route protected by `Authorization: Bearer ${CRON_SECRET}`. It claims at most three jobs per invocation, uses conditional Postgres updates for concurrent-claim protection, leases jobs for two minutes, recovers stale leases, retries transient provider failures with bounded exponential backoff, and permanently fails reconnect/configuration/permission errors. Vercel does not retry failed cron invocations, so retry state is persisted in Finance jobs. The daily schedule is deliberately conservative because webhooks are the primary freshness trigger and Vercel Hobby cron schedules are limited to daily execution.

Manual Refresh queues the same durable job instead of running provider work in the browser request. Existing normalized Finance data remains readable while the job is queued or a provider is unavailable.

# Cosmic AI · P1 foundation

Cosmic AI is a provider-neutral, read-only conversational layer. P1 keeps conversations ephemeral and uses the existing authenticated account and validated cloud-sync boundaries; it does not add a database table or action system.

## Runtime boundary

`/ai` sends a bounded recent conversation to `POST /api/ai/chat`. The server determines the account from the existing session, loads only the account's validated Settings snapshot, plans at most two deterministic retrieval calls, and sends labeled untrusted DATA plus the versioned policy to the configured provider. Guest requests receive general/public permissions only. No client scope id is trusted as account identity.

The first adapter is native `fetch` against OpenAI Responses API (`COSMIC_AI_PROVIDER=openai`, default model `gpt-5.4-mini`). The adapter is behind `services/ai/provider.ts`, so Anthropic or Gemini can be added without coupling the UI or planner to a vendor SDK. Provider credentials are server-only.

School transcript intelligence prefers OpenAI when the server-only `OPENAI_API_KEY` is configured and uses Cloudflare Workers AI as a fallback. Cloudflare-only deployments remain supported. `COSMIC_AI_MODEL` controls the existing centralized OpenAI model selection; do not expose either credential to the client.

Optional public search uses Tavily with a short query, basic depth, five-result maximum, a ten-second timeout, and source links returned to the UI. Search results are context, not instructions. Private retrieval is summary-only and permission-gated; Finance, Mail, and Notes default off. P1 has no write/action tools, no arbitrary URL fetcher, no autonomous loop, and no chain-of-thought output.

## Safety and privacy

The centralized policy is versioned as `p1-readonly-2026-08-22`. Retrieved content is explicitly untrusted DATA. The route caps messages at 20, message size at 8,000 characters, total request size at 40,000 characters, tool calls at two, and provider output at 1,200 tokens. Errors are generic and safe. `/dev/ai` is development-only and admin-only; it reports configuration state, tool names, policy version, and aggregate in-memory usage, never keys or prompts.

Revoking a module in Settings prevents the next request from using it. Existing P1 conversations remain only in the browser tab and are not persisted by Cosmic or the provider (`store: false`). The future “Report response” integration should attach response metadata/source ids only, not a whole conversation.

## Provider research snapshot (2026-08-22)

- [OpenAI model comparison](https://developers.openai.com/api/docs/models/compare) and [API pricing](https://platform.openai.com/pricing) support selecting a current server-side model by configuration; the default is intentionally replaceable.
- [Anthropic Claude API](https://www.anthropic.com/claude/api) and its [official pricing](https://www.anthropic.com/pricing) remain viable future adapters.
- [Google Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) is a viable future adapter and documents grounding economics separately from model tokens.
- [Tavily API credit documentation](https://docs.tavily.com/documentation/api-credits) and its [search endpoint](https://docs.tavily.com/documentation/api-reference/endpoint/search) support the optional bounded public-search boundary.

Provider pricing and model availability change. No quota or plan limit is invented in P1; entitlement enforcement should be centralized when Cosmic product limits are finalized.

## Known P1 limitations

Calendar, Mail, Music, Weather, and Sports are not silently fabricated into the private tool registry. Their richer adapters should be added only after their existing provider/account contracts are mapped and tested. Durable usage accounting, first-use permission dialogs, and response reporting are intentionally prepared as boundaries rather than claimed as complete features.

# Phase N3 security hardening audit

## Findings reviewed

- SQL injection: no user-controlled raw SQL was found. Drizzle builders bind account, support, search, sync, billing, and provider values. The only raw SQL is a constant `select 1`, schema checks, and a server-owned revision increment.
- Next.js, sharp, baseline-browser-mapping, postcss, and nanoid: dependency findings require an online advisory lookup/rescan. Installed versions are recorded from the lockfile; no blind or major upgrade was applied.
- Weather SSRF: provider origins are hard-coded. Latitude and longitude are range-validated at the route and engine boundaries, query strings use `URLSearchParams`, and redirects are rejected.
- Auto-ignored PostCSS, NanoID, and cache findings were not suppressed or changed. Private account/admin/support/sync/billing responses use `no-store` where applicable.

## Authorization and CSRF

Admin routes independently call `requireAdmin()`. Account, sync, billing, Garage mutations, and support mutations enforce authenticated ownership where required and same-origin checks for browser state changes. Support reports are account-scoped in every user query. No authenticated API uses wildcard CORS; the glasses routes are the explicitly separate public/device integration surface.

## Outbound requests

Weather, NHTSA, CarsXE, Google Places, and sports adapters use server-owned provider destinations. No generic user URL fetcher was introduced. Calendar connection input is restricted to HTTPS, but it is stored for a future provider operation and should receive a dedicated private-network/redirect policy before active CalDAV fetching is enabled.

## Secrets and errors

Tracked-file scanning found configuration names and documentation references, not printed secret values. `.env.local` is ignored and untracked. Production account deletion, billing, and sync failures return generic messages rather than exception text. Support diagnostics use centralized redaction.

## Rate limiting and dependency audit

There is no configured distributed rate limiter. Sign-in, sign-up, support submission, admin search/mutations, VIN, and plate lookup remain candidates for the next infrastructure phase.

Online audit remediation updated Next to `16.3.2`, sharp to `0.35.3`, PostCSS to `8.5.23`/`8.5.26`, and NanoID to `3.3.18`. A non-force audit fix also cleared brace-expansion and js-yaml. One moderate dev-only esbuild advisory remains through Drizzle Kit’s legacy `@esbuild-kit` path; removing it would require the audit-recommended breaking `drizzle-kit@0.18.1` downgrade, so it was not applied.

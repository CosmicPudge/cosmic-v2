# Cosmic product tiers

This is the canonical internal policy for Free and Cosmic+. Future feature work should consult this document before adding a paywall, quota, ad placement, or downgrade behavior.

## Product principle

Cosmic Free gets the tools. Cosmic+ makes those tools smarter, more automated, more scalable, more customizable, and ad-free. Free must remain genuinely useful; security, privacy, ownership, accessibility, deletion, export, and core module functionality are never subscription benefits.

Cosmic+ is account-wide. The long-term model is one Cosmic+ account across Web, iPhone/iPad, and Android. App-store billing details are deferred.

## Plans

| Plan | Price | Intent |
| --- | --- | --- |
| Cosmic Free | $0 | Core Cosmic tools, cloud sync, basic personalization, and non-intrusive advertising where allowed |
| Cosmic+ | $4.99/month | Everything in Free, with no third-party ads and advanced intelligence, automation, scale, customization, and integrations |

## Advertising

Free may eventually include responsive banner or native/content-feed placements and clearly separated sponsored placements. Every placement must be labeled `Sponsored` or `Advertisement`.

Never use forced or unskippable video, interstitial navigation ads, full-screen blocking ads, autoplay audio, popups, countdowns, ads covering controls/content, ads disguised as Cosmic UI, or ads interrupting diagnostics and critical workflows. Do not show third-party ads on sign-in, account, billing, checkout, subscription management, deletion, privacy/security, destructive confirmation, or actively running diagnostic surfaces.

Cosmic+ has no third-party advertising anywhere. Ad eligibility must be derived globally from the centralized entitlement result and consumed by a future reusable `AdSlot`; modules must not invent their own ad decisions. No real ad provider or development impressions are integrated in this phase.

Private Cosmic data must never be sent to advertising providers for behavioral targeting. This includes Finance, Mail, Calendar, Notes, Garage VIN/plate/DTC/maintenance/telemetry/location data, health data, and other private records. Advertising and private Context remain separate.

## Module policy

“Basic” means useful core functionality remains available on Free. “Advanced” is a candidate for Cosmic+ and must be implemented only when the underlying capability exists.

| Module | Free | Cosmic+ |
| --- | --- | --- |
| Dashboard | Core widgets, ordering/visibility, personalization | Ad-free, advanced layouts, deeper customization, profiles, Context-driven prioritization |
| Context | Upcoming events, basic Garage/Sports/Finance context, limited prioritization | Full ranking, cross-module reasoning, personalized summaries, proactive suggestions |
| Sports | NFL, MLB, NBA, MLS, Formula 1, NASCAR, schedules, scores, results, standings, Event Center, pages, favorites, Search, Dashboard | Ad-free, advanced Context, notifications, history, summaries, personalization, AI intelligence |
| Garage | Up to 3 active vehicles; manual entry, basic collections, mileage, fuel/MPG, maintenance, service, issues, modifications, expenses, reminders, timeline, basic diagnostics/telemetry when available, Search, export | Unlimited active vehicles, VIN/plate lookup, ad-free, advanced collections, project/fleet/ownership/expense/maintenance/diagnostic/repair intelligence, advanced connections |
| Finance | Manual accounts, transactions, balances, categories, summaries, basic budgets/recurring support, history, Search, export | Advanced recurring, budgeting, forecasting, cash-flow intelligence, analytics, Context, trends, alerts |
| Calendar | Events, Dashboard, basic Context, one private connection, Search | Multiple private connections, advanced Context, cross-calendar intelligence, scheduling assistance, automation |
| Mail | Supported provider connection, basic reading/inbox data, Search, Dashboard information | AI analysis, summaries, important-message intelligence, scheduling, Context, automation |
| Music | Basic provider connection, Now Playing, playback information, supported controls, Dashboard/Ambient integration | More connections, listening intelligence, smarter Ambient behavior |
| Notes | Create/edit/delete, Search, sync, basic organization | AI summaries/organization, semantic Search, linking/extraction, Context, document intelligence |
| Projects | Projects, tasks, milestones/basic records, Search, sync, Dashboard integration | AI summaries, cross-project intelligence, analytics, planning, task extraction, Context, future collaboration |
| School | Courses, assignments, grades, schedule, core tools | Future academic analytics, forecasting, study assistance, Context; no new School paywall in this phase |
| Search | Global Search across apps, modules, Sports, Garage, Notes, Projects, and owned results | Semantic Search, natural-language queries, relationships, interpretation, advanced ranking, document Search |
| Ambient | Clock, Weather, basic Sports/Calendar/Garage alerts, Now Playing, basic rotation | Context-controlled prioritization, personalization, layouts, summaries |
| Notifications | Important basic reminders, maintenance, game start/final, critical Garage issues, security notices | Custom rules, Sports triggers, diagnostic/Finance intelligence, Context-based cross-module notifications |
| Files | Future basic attachments, reasonable allowance, export/download | Larger allowance, document Search, AI understanding, receipt extraction, Garage intelligence |

Do not invent arbitrary tiny limits for Notes, Projects, or Files. Storage and AI quotas require real cost modeling first.

## Garage rules

The canonical numeric entitlement is `entitlements.limits["garage.activeVehicles"]`: Free is `3`; Cosmic+ is `null` (unlimited). Active means a vehicle that is not sold or archived. Sold/archived history never counts against the limit.

Downgrades preserve every vehicle and record. If a Cosmic+ account has more than three active vehicles, the account remains above the Free limit, can view and export the data, and cannot add another active vehicle until it is back within the limit or upgrades. Cosmic must not delete history or hold it hostage.

Manual vehicle creation is Free. VIN lookup, license-plate lookup, VIN camera scanning, and license-plate camera scanning are Cosmic+ capabilities. A Free user selecting any of these methods should receive a clear explanation and the choice to upgrade or enter manually. Existing decoded VIN/plate data remains after downgrade; the entitlement controls future lookup requests. M5 provider availability and M6 scanning constraints are documented in `docs/garage-external-providers.md`.

Vehicle creation and future lookup mutations must enforce entitlements on the server from the authenticated account. Client gates are only UX. The current implemented VIN route now derives the plan server-side; a server-backed Garage mutation should apply the same canonical limit before cloud writes are introduced.

## Connections and downgrade behavior

Free supports reasonable basic connections: one private Calendar, one basic Mail connection, one Music provider, and basic OBD when available. Cosmic+ can support multiple providers/accounts and advanced vehicle connections. Downgrades preserve existing records, credentials, connections, preferences, Dashboard layouts, Finance records, Calendar connections, Garage data, Notes, and Projects wherever possible; only future premium actions become unavailable.

## AI, privacy, and security

Free may receive limited/basic AI where economically reasonable. Cosmic+ may receive higher usage, advanced Context, cross-module reasoning, and advanced summaries. Exact quotas are deferred until cost modeling.

Free and Cosmic+ have the same authentication, account isolation, encryption where appropriate, credential protection, privacy controls, deletion, export, session security, billing security, and ownership boundaries. Critical account/security notifications are never paywalled.

## Guests and development overrides

Guests behave as Free by default. Development entitlement overrides remain development-only and must not grant Cosmic+ capabilities in production. The `/dev/entitlements` inspector may expose the resolved plan, source, ad eligibility, Garage active-vehicle limit, and feature flags, but never secrets.

## Central implementation contract

`core/contracts/Entitlements.ts` is the source of truth for plan-derived feature flags, ad eligibility, and numeric limits. Use the existing entitlement service to resolve the authenticated account. Do not scatter `plan === "cosmic_plus"` checks through components and routes, and do not create a second entitlement state system.

Current canonical values:

- `freeEntitlements`: Free/guest defaults, third-party ads eligible, Garage active limit `3`.
- `cosmicPlusEntitlements`: Cosmic+, no third-party ads, Garage active limit `null`.
- `garage.advanced`: the current feature flag for advanced Garage actions such as VIN lookup.

## Deferred decisions

Real ad providers, mobile ad SDKs, OEM connections, App Store/Google Play billing, advanced AI, exact AI/storage quotas, and additional server-backed Garage mutations are intentionally deferred. Do not advertise unfinished capabilities as live.

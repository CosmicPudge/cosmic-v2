# Cosmic OS — Phase Q2 boot, preloading, and navigation transitions

## Audit outcome

The repository already had a `BootManager` and `CosmicBoot` implementation, but `CosmicBoot` was not mounted by the active `/os` shell. Route `loading.tsx` coverage was also inconsistent: `/os/loading.tsx` was raw placeholder text and the root loading surface was absent. Most module data is client-owned and scope-aware, so a new data repository would have duplicated requests and cache rules.

Q2 adds one coordinator at the root provider boundary. It consumes the existing Account, Settings, scope, entitlement, and module readiness signals. It does not preload full provider histories, call Stripe, load ads as a critical task, or invent new data caches.

## Coordinator states

| Mode | When | Reveal policy |
| --- | --- | --- |
| BOOT | First client render or hard refresh | Critical workspace tasks plus a 900ms branded minimum, bounded by 7 seconds |
| HEAVY | Account A/B, guest/account, or account/guest scope change | Clears the account identity and local scope first, waits for critical tasks, then reveals or times out |
| NORMAL | Meaningful route change | Destination label and restrained overlay; route code/readiness and animation run concurrently |
| INSTANT | Cached/stable UI | No global overlay; module-level loading remains available |

Reduced motion shortens the boot minimum and removes constellation movement. Offline events change the copy to saved-state/degraded language; the bounded timeout prevents impossible network requests from trapping the app.

## Critical preload tasks

The boot surface reports completion counts for:

- Account/session identity
- Active local/account scope
- Settings/preferences hydration
- Database-backed entitlement state (used to stabilize Free/Cosmic+ layout)
- Dashboard frame readiness

Weather, Calendar, Sports, Garage, Mail, Finance, Notes, Projects, School, Music, and Context use their existing repositories/hooks. Their first frame may continue with an inline skeleton or truthful degraded state. Ads remain non-critical and are not added to the boot task list.

## Route preload matrix

| Route | Critical readiness | Background work | Cache behavior | Timeout behavior |
| --- | --- | --- | --- | --- |
| `/os` | Workspace + dashboard frame | Widget summaries, weather, calendar, sports, Garage attention | Existing widget hooks/repositories | Dashboard reveals after critical core or 7s |
| `/weather` | Conditions or known error/offline state | Radar, hourly, daily, air quality, alerts | Existing weather hook | Inline weather state remains truthful |
| `/sports` | Primary snapshot or provider-degraded state | Event Center, standings/detail routes | Existing sports hook/cache | Sports page reveals with provider message |
| `/garage` | Scoped Garage snapshot + entitlement limits | Vehicle timelines, diagnostics, OBD/scan extras | Existing Garage repository/cloud sync | Local/degraded Garage remains usable |
| `/gmail` / `/outlook` | Connection state + initial frame | Threads, message detail, AI actions | Existing provider hooks | Connection/error frame reveals |
| `/calendar` | Connection state + visible window | Wider ranges and edits | Existing calendar hook | Local/error frame reveals |
| `/finance` | Private scoped local/cloud snapshot | Intelligence and extended records | Existing finance repository | Never displays another scope's balances |
| `/notes` / `/projects` / `/school` | Account-scoped base snapshot | Detail/editor content | Existing scoped repositories | Inline loading/degraded state |
| `/music` | Provider/connection/now-playing state | Playback history | Existing music hook | Connection/unavailable frame reveals |
| `/search` | Search frame only | Results after query | Existing SearchProvider | No global result preload |
| Context | Deterministic baseline where already available | Expensive candidates | Existing context hooks | Inline loading/degraded state |

Routes without a readiness adapter use route code readiness plus their existing `loading.tsx`/module loading UI. `AppShell` registers that lightweight fallback automatically; Weather, Sports, Garage, and Finance also register their existing critical state.

## Navigation and prefetch

Existing Next `<Link>` behavior remains intact, including viewport prefetch, Cmd/Ctrl-click, middle-click, open-in-new-tab, history, and external links. The OS sidebar and AppHeader use bounded intent points (hover/focus) to call `router.prefetch()`; they do not globally hijack anchors or create provider requests. Route transition overlay timing never blocks the route request.

## Request behavior

Before Q2, every entitlement consumer could independently run the same account entitlement request. Q2 promotes entitlement loading to `EntitlementsProvider`, so consumers share one request and one state. Boot itself reads that shared state and adds no module fetches. Ads remain after core readiness, and Stripe/billing is not called during boot.

## Development diagnostics

`/dev/transitions` shows state, intensity, destination, reduced-motion state, critical task completion, and the major-route readiness map without payloads or secrets. In development, `?transitionDebug=slow` marks slow-mode for visual inspection; production ignores that flag. The transition logger records only destination, mode, task-level timing, and timeout outcomes.

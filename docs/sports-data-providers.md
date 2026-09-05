# Sports data providers

Cosmic consumes normalized Sports models. Provider URLs and response parsing stay behind provider adapters so a licensed feed can replace ESPN later.

| Sport | Primary adapter | Endpoint family | Cache strategy | Known limitations |
| --- | --- | --- | --- | --- |
| MLB | Existing MLB Stats API provider | MLB Stats API | Existing provider-specific cache | League feed remains separate from football. |
| NFL | ESPN Football adapter | `site.api.espn.com` scoreboard, team schedule, summary, standings; `sports.core.api.espn.com` plays/drives | Team schedule 10 minutes; live detail 2–5 seconds at the provider layer; standings 15 minutes | ESPN endpoints are publicly accessible product feeds, not represented as a stability-guaranteed public developer API. |
| College Football | ESPN Football adapter | ESPN team catalog, scoreboard, team schedule, summary, rankings; shared football core where exposed | Directory 24 hours; team schedule 15 minutes; live detail short cache/no-store refresh; rankings 15 minutes | Catalog membership, conference metadata, and live situation fields can change or be absent. |

The centralized endpoint constructors live in `services/sports/providers/espnFootball/endpoints.ts`. Requests are server-side and use the existing defensive fetch/cache boundary. Client components never construct ESPN URLs or parse raw ESPN payloads.

Football normalization is shared above the provider layer through the Cosmic football contracts. NFL and College Football may omit fields the provider does not expose; Cosmic leaves those values unavailable instead of manufacturing scores, records, rankings, timeouts, play clocks, or field positions.

The current CFB catalog sync is reproducible with:

```bash
npx tsx scripts/sports/sync-cfb-teams.ts
```

ESPN is not treated as a formal data-redistribution license. The provider and asset documentation records provenance and limitations only.

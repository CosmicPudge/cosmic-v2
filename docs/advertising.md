# Cosmic OS advertising · Phase O2

## Decision

The launch boundary is Google AdSense, configured as `google-adsense`, because its current eligibility guidance does not publish a minimum traffic threshold: the applicant must be 18+ (or use a parent/guardian account), own the site, provide original/high-quality content, and comply with program policies. Approval is still required; this repository does not claim a live publisher account or live ads.

| Provider | Current published entry signal | Responsive | Intrusive formats optional? | Privacy/testing | O2 suitability |
| --- | --- | --- | --- | --- | --- |
| Google AdSense | 18+, owned site, original/high-quality policy-compliant content; no traffic minimum stated in eligibility guidance | Yes, responsive `adsbygoogle` units | Controls exist, but publisher policy review is still required | Google Privacy & messaging, EEA/UK/CH IAB TCF 2.3 path, US state/GPP support, test parameters | Best practical launch boundary |
| Mediavine Journey | Application/acceptance model; current public affiliate terms do not establish a universal traffic minimum | Responsive management platform | More managed/automated; format controls must be confirmed during acceptance | Managed consent/publisher tooling varies by acceptance | Future candidate after content/audience validation |
| Raptive | Premium publisher application; the reviewed current public media kit does not establish a universal small-site threshold | Responsive managed inventory | Managed controls; confirm in contract | Managed publisher tooling | Later-stage candidate |
| Carbon Ads | Niche developer/design inventory; acceptance and inventory fit are selective | Responsive placements available by implementation | More restrained formats, but limited demand fit | Publisher terms/privacy must be reviewed before launch | Good aesthetic candidate, uncertain fit |
| EthicalAds | Developer-focused network with published ad-spec material; approval and inventory fit required | Responsive text/image formats | Stronger control over restrained formats | Consent/privacy obligations remain publisher responsibility | Strong privacy/aesthetic alternative |

The comparison intentionally does not invent payout thresholds, revenue shares, traffic requirements, or approval guarantees where current public first-party material did not state them. Before choosing a managed alternative, obtain its current publisher agreement and confirm U.S. payment availability, payout threshold, invalid-traffic policy, ads.txt entries, consent handling, COPPA/age treatment, and unwanted-format controls.

Current primary references: [AdSense eligibility](https://support.google.com/adsense/answer/9724), [AdSense ads.txt](https://support.google.com/adsense/answer/12171612), [AdSense privacy and messaging](https://support.google.com/adsense/answer/10924669), [AdSense GPP support](https://support.google.com/adsense/answer/14126816), [AdSense EEA/UK/Switzerland consent](https://support.google.com/adsense/answer/10961068), and [EthicalAds ad specifications](https://www.ethicalads.io/prospectus/ad-specs.pdf).

## Runtime architecture

`AdSlot` remains the only placement component. `AdProvider` is the single browser-script boundary. It reads centralized `getAdRuntimeConfig()`, checks effective Free/Guest entitlement, and loads the Google script only in `test` or `live` mode when a public publisher ID and slot IDs exist. Cosmic+ does not load the provider script and receives no reserved ad slot. `disabled`, `placeholder`, `test`, and `live` are explicit modes. `NEXT_PUBLIC_COSMIC_ADS_ENABLED=false` is the emergency kill switch.

Dashboard placement density is centralized: `dashboard.primary.after` is used for short dashboards, `dashboard.feed.middle` is added for medium/long dashboards, and `dashboard.feed.lower` is added only for very long dashboards. Each placement is inserted as a full-row normal-flow grid child, never as an overlay. Other routes retain one dedicated overview/peripheral block each.

Development defaults to placeholders and never loads a live provider. Test mode uses AdSense's `data-adtest="on"` flag and still requires configured public IDs. Live mode additionally requires a provider consent signal (`__tcfapi` or `__gpp`) so this code does not pretend that generic privacy text is a consent-management platform. The production integration is therefore not live-ready until a compliant CMP/Google Privacy & messaging configuration is published and verified.

No custom impression/click tracking is implemented. No private module data, account identifiers, AI prompts, Finance records, Mail, Calendar, Notes, Projects, Garage identifiers, or exact location is passed to the provider. The placement registry contains only coarse public surface labels.

## Layout and failure behavior

O1's single overview placements remain at section boundaries: after primary Dashboard content, Garage overview, Sports overview, Search results, Weather overview, Calendar peripheral content, Projects overview, and School overview. Calendar is desktop-only. No placement is added to Finance, Mail, Notes, Context, Settings, Account, Authentication, Admin, Support, Billing, Cosmic+, Music, forms, diagnostic detail, or destructive confirmations. The diagnostic preview now checks mobile/tablet/desktop containers and optional `?adDebug=1` boundaries.

Provider failure collapses the slot and leaves Cosmic usable. Provider script loading is not awaited by primary content. Placeholder dimensions are bounded to reduce layout shift; Cosmic+ has no reservation. The current app has security headers but no enforced CSP; O2 does not add `script-src *`. If CSP is introduced later, the provider will require narrowly scoped `script-src`, `connect-src`, `img-src`, and `frame-src` entries after a browser-network audit.

## Manual setup (not completed in code)

1. Create/verify an AdSense publisher account using an adult account and confirm Cosmic's public site has original, policy-compliant content.
2. Add the actual publisher site in AdSense. Verify whether the approved site is `cosmicpudge.shop` or `os.cosmicpudge.shop`; do not assume the subdomain is the publisher root.
3. Complete Google's site verification and approval. Do not enable live mode before approval.
4. Create responsive display ad units and record the public publisher ID (`pub-` plus 16 digits) and each unit's public slot ID.
5. Add `NEXT_PUBLIC_COSMIC_ADS_ENABLED=true`, `NEXT_PUBLIC_COSMIC_ADS_MODE=test`, `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`, and the ten `NEXT_PUBLIC_ADSENSE_SLOT_*` values to the deployment environment. These are public IDs, not secrets.
6. Configure Google's Privacy & messaging for applicable U.S. state opt-out/GPP handling and EEA/UK/Switzerland consent using a certified TCF path. Verify the resulting `__tcfapi`/`__gpp` signal before live mode.
7. Confirm `/ads.txt` returns `google.com, pub-…16-digits…, DIRECT, f08c47fec0942fa0`; the route stays 404 until a real publisher ID is configured.
8. Validate test mode on a non-production/approved test environment. Never click live ads. Then change only the mode to `live` after approval and privacy verification.

## Phase O3 review readiness

The canonical production site is `https://cosmicpudge.shop`. The legacy hostname `os.cosmicpudge.shop` is not referenced by runtime code; configure it as a Vercel/domain-level permanent redirect preserving path and query. Do not add application middleware unless the hosting configuration cannot provide this redirect.

The application remains safe with `NEXT_PUBLIC_COSMIC_ADS_MODE` unset or `disabled`. Do not set `live` before AdSense approval. The Google publisher script has one provider boundary and is loaded only for eligible Free/Guest users when the configured mode, public IDs, and consent readiness permit it. CMP readiness is bounded to eight seconds; failure closes ads without blocking Cosmic.

Public review surfaces are available at `/`, `/os`, `/privacy`, `/terms`, `/support`, and `/ads.txt`. The public sitemap includes only public routes. Account, Finance, Mail, Garage detail, admin, dev, and API routes are excluded from the sitemap/robots allowlist.

### Production checklist

1. Verify ownership of `cosmicpudge.shop` in Google AdSense and complete site review.
2. Publish and verify `/ads.txt` with the real public publisher ID.
3. Configure Google's certified CMP with Consent / Do not consent / Manage options and verify `__tcfapi`/`__gpp` behavior.
4. Publish Privacy and Terms and confirm the public footer links.
5. Configure public publisher and unit IDs in the deployment environment; these are not secrets.
6. Validate `test` mode on an approved test environment. Never click ads.
7. After approval only, enable `live` and manually verify Free, Guest, Cosmic+, responsive, ad blocker, no-fill, and sensitive-surface behavior.

### External dashboard changes required

- Vercel: set `NEXT_PUBLIC_APP_URL=https://cosmicpudge.shop`, configure the canonical domain, and create the legacy-domain redirect.
- Google AdSense: add/review `cosmicpudge.shop`, complete ownership/site review, configure Privacy & messaging, and verify ads.txt.
- Google OAuth: replace any callback URI still registered to the legacy hostname, if present.
- Stripe: set production success/cancel/portal return origins through `NEXT_PUBLIC_APP_URL` and verify webhook configuration.
- Other providers: replace any OAuth callback or allowed-origin entry that still uses `os.cosmicpudge.shop`.

## Launch gates

Live ads are not ready until publisher approval, exact domain ownership, CMP/privacy configuration, ads.txt verification, public IDs, provider policy review, and manual Free/Cosmic+/Guest/responsive testing are complete. The code intentionally does not fabricate revenue, impressions, approval, or consent compliance.

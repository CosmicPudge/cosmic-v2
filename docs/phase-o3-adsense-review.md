# Cosmic OS — Phase O3 AdSense review readiness

## Current state

- Canonical production domain: `https://cosmicpudge.shop`
- Legacy domain: `https://os.cosmicpudge.shop` should permanently redirect at the hosting/domain layer.
- `/` continues to redirect to `/os`.
- `/ads.txt` is public, text/plain, publisher-configurable, and returns 404 when unconfigured.
- Live ads remain disabled. No deployment environment was changed by this phase.

## Privacy boundary

The registry and slot component expose only coarse placement context. They do not send account IDs, emails, search history, module content, Garage identifiers, Finance records, Mail bodies, Calendar content, School content, or AI prompts as custom targeting. Sensitive surfaces remain prohibited or outside the placement registry.

Cosmic's own local storage, account data, provider connections, sync snapshots, and support reports are separate from third-party advertising technology. The public Privacy Policy documents that distinction and does not claim that Cosmic is cookie-free.

## Environment checklist

`NEXT_PUBLIC_APP_URL=https://cosmicpudge.shop`

Advertising public configuration consists of:

- `NEXT_PUBLIC_COSMIC_ADS_ENABLED`
- `NEXT_PUBLIC_COSMIC_ADS_MODE` (`disabled`, `placeholder`, `test`, or `live`)
- `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`
- Ten `NEXT_PUBLIC_ADSENSE_SLOT_*` values corresponding to the registry.

No secret is required by the browser advertising integration. Do not set `live` until Google approves the site and CMP/privacy configuration has been manually verified.

# Physical kiosk portability

Cosmic kiosks use the same normal boot flow on every network. The launcher must preserve the current Linux boot binding:

```sh
BOOT_ID="$(cat /proc/sys/kernel/random/boot_id)"
COSMIC_URL="https://dev.cosmicpudge.shop/kiosk?cosmic-kiosk=1&cosmic-boot=${BOOT_ID}"
```

The boot ID binds the temporary browser handoff and device session to the current Pi boot lifecycle. It is not an account credential and cannot authenticate by itself.

The trusted helper remains loopback-only at `127.0.0.1:8765`. The device credential stays outside Chromium; the browser receives only the short-lived handoff/session result. The helper accepts the configured Cosmic origin and does not expose credentials or execute arbitrary commands.

## Network changes and recovery

NetworkManager owns Wi-Fi credentials. Add a new network locally through Raspberry Pi OS/NetworkManager (`nmcli device wifi list` and `nmcli device wifi connect <SSID> --ask`) or the OS desktop network UI. Cosmic does not store or expose Wi-Fi passwords and does not require an inbound LAN callback.

The application observes browser online/offline state and service health independently of the OS `cosmic-netwatch` timer. If Wi-Fi is connected but Cosmic cannot be reached, the kiosk remains in its bounded reconnecting/stale presentation; it does not attempt to bypass captive portals. A captive portal must be completed through the OS/network UI.

On reconnect, the browser handoff loop retries with bounded periodic attempts. If the session has expired, a new handoff redemption can establish a fresh temporary browser session without changing device identity, account preferences, or provider credentials.

## Location resolution

Standalone kiosk location follows this hierarchy:

1. Current browser geolocation, requested at startup and refreshed periodically, after `online`, and after visibility recovery.
2. A timestamped browser-local last-known location, valid for a bounded period while offline.
3. The configured `COSMIC_KIOSK_LAT`, `COSMIC_KIOSK_LON`, and optional `COSMIC_KIOSK_LOCATION_LABEL` fallback.

Only city/region-level labels are presented. Coordinates are used as bounded inputs to current weather, forecast, AQI, NWS alerts, and location-sensitive weather calculations; they are not logged, added to analytics, or rendered in the kiosk UI. Material movement triggers a fresh kiosk Weather request and updates the city label when the provider supplies one.

If geolocation is denied or unavailable, the kiosk remains usable with the last-known or configured fallback location and marks the data stale through the normal service-health presentation.

## Sports venue registries

MLB venue resolution is ID-first, with home-team and bounded aliases as fallbacks. The registry is designed to add venue imagery without changing Sports ranking. College football has a separate extensible venue model for school venues, neutral sites, bowls, and playoff locations; it is intentionally unpopulated until local imagery is available.

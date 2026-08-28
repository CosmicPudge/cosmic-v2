# Raspberry Pi Cosmic Kiosk Setup

Run these commands on the Raspberry Pi as `cosmicpudge`. This repository does
not modify the Pi filesystem and does not provide hardware-control endpoints.

## Create the launcher

```bash
mkdir -p ~/.local/bin ~/.config/systemd/user ~/.config/cosmic-kiosk
cat > ~/.local/bin/cosmic-kiosk <<'EOF'
#!/bin/bash
set -eu
BOOT_ID="$(cat /proc/sys/kernel/random/boot_id)"
COSMIC_URL="https://cosmicpudge.shop/os/kiosk?cosmic-kiosk=1&cosmic-boot=${BOOT_ID}"
sleep 1
exec /usr/bin/chromium \
  --kiosk \
  --no-first-run \
  --no-default-browser-check \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --disable-translate \
  --password-store=basic \
  --overscroll-history-navigation=0 \
  --ozone-platform=wayland \
  --user-data-dir="$HOME/.config/cosmic-kiosk" \
  "$COSMIC_URL"
EOF
chmod 755 ~/.local/bin/cosmic-kiosk
```

## Create and enable the user service

```bash
cat > ~/.config/systemd/user/cosmic-kiosk.service <<'EOF'
[Unit]
Description=Cosmic OS Kiosk

[Service]
Type=simple
ExecStart=%h/.local/bin/cosmic-kiosk
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF
systemctl --user daemon-reload
systemctl --user enable cosmic-kiosk.service
```

Ensure `~/.config/labwc/autostart` contains:

```bash
systemctl --user start cosmic-kiosk.service &
```

Then restart it or log out and back into the `rpd-labwc` session:

```bash
systemctl --user restart cosmic-kiosk.service
```

## Hide the pointer on the Wayland kiosk

\`unclutter\` is an X11 utility and is not the reliable choice for Chromium
running natively under labwc/Wayland. Use labwc's native \`HideCursor\` action
with the Wayland \`wtype\` client instead. Install the tools on the Pi:

\`\`\`bash
sudo apt install -y wtype swayidle
\`\`\`

The commonly used X11 setup is \`sudo apt install -y unclutter\`, but it is
intentionally not used by this native Wayland launcher because it cannot
reliably control the labwc pointer.

Add this key binding inside the \`<keyboard>\` element of
\`~/.config/labwc/rc.xml\`:

\`\`\`xml
<keybind key="A-W-h">
  <action name="HideCursor" />
  <action name="WarpCursor" x="-1" y="-1" />
</keybind>
\`\`\`

Add the following to \`~/.config/labwc/autostart\` before the kiosk service:

\`\`\`bash
swayidle -w timeout 1 'wtype -M alt -M logo h -m alt -m logo' >/dev/null 2>&1 &
\`\`\`

\`swayidle\` invokes the labwc shortcut after one second of inactivity. The
pointer may briefly reappear after physical pointer movement and will be
hidden again on the next idle timeout. This does not affect touch input or
require any kiosk interaction. Test the shortcut manually with Alt+Super+H;
do not add \`cursor: none\` to the Cosmic website, since cursor policy belongs
to the device compositor.

## Check, stop, and debug

```bash
systemctl --user status cosmic-kiosk.service
systemctl --user restart cosmic-kiosk.service
systemctl --user stop cosmic-kiosk.service
journalctl --user -u cosmic-kiosk.service -n 100 --no-pager
journalctl --user -u cosmic-kiosk.service -f
```

Chromium uses the persistent `~/.config/cosmic-kiosk` profile so permissions
survive restarts. The launcher intentionally does not use `--no-sandbox`.
The boot ID is supplied by Linux and stays stable if Chromium crashes and is
restarted during the same OS boot. Cosmic requires a fresh phone/browser
approval when the boot ID changes after a Raspberry Pi reboot; the registered
device itself is retained.

The kiosk adapts from the browser viewport, shared Cosmic display profile, and
input capabilities. It does not use Raspberry Pi user-agent detection.

## Persistent device identity and physical reset contract

After first approval, the server assigns a permanent public number such as
`COSMIC-482731`. This is a support/reference identifier and is different from
the short-lived activation code, database device ID, boot ID, and private
credential. The web app stores the private credential in an HttpOnly cookie as
a compatibility fallback; it is never rendered, put in a QR/URL, or logged.

For hardware-grade persistence, a future Pi helper must own the credential in a
root-readable or service-private file (for example, `/var/lib/cosmic-device/
credential` with mode `0600`) and keep the device number only as metadata. The
helper can bootstrap a session by calling:

```text
POST /api/devices/bootstrap
Authorization: Bearer <private credential>
{"bootId":"<current /proc/sys/kernel/random/boot_id>"}
```

The server returns a short-lived device session and never returns the
credential. The browser fallback calls the same endpoint using its HttpOnly
credential cookie. The new boot ID is bound to the new session; the permanent
device record and owner remain unchanged.

Devices created before persistent credentials were introduced have a null
credential hash after migration. While that device still has a valid
device-session/boot, provision it exactly once with:

```text
POST /api/devices/provision?cosmic-kiosk=1&cosmic-boot=<current boot id>
Cookie: cosmic_session=<current device session>
```

The server generates the credential randomly, preserves the existing device
number, and returns the one-time credential only to this authenticated
provisioning caller. The Pi helper must immediately store it in private 0600
state and never put it in browser-visible UI, a URL, or logs. Repeating the
call after provisioning does not return the credential again.

The physical reset endpoint is:

```text
POST /api/devices/reset
X-Cosmic-Device-Credential: <private credential>
```

It must be called only by the helper over TLS. A public device number,
activation code, browser account session, or credential cookie is insufficient.
On success the server revokes old sessions, clears account-scoped kiosk
settings, preserves the public number, marks the device unclaimed, and returns
one newly rotated credential for the helper to store. The helper must replace
its old credential atomically, restart Chromium, and enter the activation
screen. If the network is unavailable, the helper must keep a local
`pending-reset` marker, stop Chromium from displaying the old account, retry
the reset when online, and delete the marker only after the server confirms
success. That offline local quarantine is not implemented by this web repo.

The owner-facing **Prepare for new owner** action performs the server-side
equivalent: it revokes sessions, clears kiosk settings and credential material,
removes ownership while retaining the public number, and makes the device
claimable again. It does not implement a physical button or GPIO reset.

## Trusted Cosmic Display helper

Chromium is not the permanent identity store. The production helper is the
loopback-only `scripts/cosmic_display_helper.py`. Its default state file is
`/var/lib/cosmic-display/device.json` and contains only a schema version,
public module number, internal device ID, and private credential. The
directory must be mode `0700`; the file must be mode `0600`, owned by a
dedicated helper service account that Chromium cannot read. The helper writes
replacement state through a same-directory temporary file and atomic rename.
It does not assume a TPM or secure enclave exists on the Pi.

The helper listens only on `127.0.0.1:8765` and exposes one browser-facing
operation:

```text
POST http://127.0.0.1:8765/v1/browser-handoff
{"bootId":"<current Linux boot ID>"}
```

When a credential exists, the helper calls `POST /api/devices/handoff` over
HTTPS with `Authorization: Bearer <credential>`. The server validates the
credential, ownership, and exact boot ID, then returns a random one-time
handoff token. The helper returns only that token and the device ID to
Chromium. Chromium exchanges it at `POST /api/devices/handoff/consume`; the
server consumes it once and sets only the temporary browser session cookie.
The permanent credential never reaches browser JavaScript, a URL, a
screenshot, or a log. Handoffs expire after 60 seconds and are boot-bound.

Install the helper as a separate service, not as a browser child process. A
future Pi deployment can use a dedicated `cosmic-display` service account and
a unit similar to:

```ini
[Unit]
Description=Cosmic Display trusted helper
After=network-online.target

[Service]
Type=simple
User=cosmic-display
Group=cosmic-display
ExecStart=/usr/bin/python3 /opt/cosmic-display/cosmic_display_helper.py
Environment=COSMIC_SERVER_URL=https://cosmicpudge.shop
Environment=COSMIC_DISPLAY_STATE_FILE=/var/lib/cosmic-display/device.json
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

The kiosk unit should use `After=cosmic-display-helper.service` and
`Requires=cosmic-display-helper.service`. This repository does not install or
enable systemd units on the developer machine.

The helper lifecycle is:

```text
identity + credential → AUTHENTICATING_DEVICE → RUNNING
temporary network/server failure → RECONNECTING
identity + no credential → NEEDS_PROVISIONING for the same module
missing/corrupt identity → IDENTITY_RECOVERY
authoritative revoked/unclaimed → clear owner credential, retain module ID
```

First credential provisioning uses the helper enrollment protocol. The helper
creates a private high-entropy challenge and registers only its hash against
the exact existing device. The current owner explicitly approves the
challenge at `/activate/recover?challenge=<id>`. The helper generates and
atomically stages the new credential locally, sends only its hash to the
server, polls for an owner-authorized grant, and proves possession of the
staged credential to finalize it server-to-server.
The grant is derived from a server-only `COSMIC_ENROLLMENT_SECRET`, stored
only as a hash, expires after ten minutes, and cannot be replayed after
consumption. The browser sees the recovery link/status but never the
credential. If the helper fails while persisting after server rotation, it
does not occur in this staged protocol: the helper persists before server
finalization. If finalization fails, it retries the same transaction. If the
server finalizes and the helper crashes before clearing local enrollment, a
retry with the same staged credential is idempotently recognized. Expired or
invalid transactions are quarantined and require a new owner approval rather
than guessing or restoring an old secret.

Set `COSMIC_ENROLLMENT_SECRET` to a high-entropy server secret in every
server environment before enabling enrollment. The existing browser
credential cookie remains only a development/backward-compatibility fallback
and is not authoritative hardware storage.

Expired enrollment and handoff rows may be removed by a scheduled server-side
cleanup using only their expiry/consumption state; cleanup never deletes a
device or changes its public module number.

The helper source and a hardened example unit are in
`scripts/cosmic_display_helper.py` and
`docs/systemd/cosmic-display-helper.service`. Install the unit only after
creating the dedicated service account and state directory. The kiosk
dependency drop-in is `docs/systemd/cosmic-kiosk-helper.conf`.

For local testing without `/var` or systemd:

```bash
export COSMIC_DISPLAY_STATE_FILE="$PWD/.cosmic-display/device.json"
export COSMIC_SERVER_URL="http://localhost:3000"
python3 scripts/cosmic_display_helper.py
```

Never place a credential in shell history, URLs, browser storage, or
diagnostics. A public module number, database ID, activation code, boot ID,
or browser request cannot authorize physical reset. A future GPIO reset
listener must be a separate privileged local process, preserve the permanent
module identity, clear owner-specific state, and remain unreachable through
this browser API.

## Development simulator

The simulator is development-only and must not synthesize production data:

```text
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=none
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=nfl
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=mlb
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=f1
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=nascar
```

## Allow trusted kiosk capabilities in Chromium

Cosmic does not request camera or microphone access just to inspect hardware,
and it never starts capture automatically. The kiosk may use these capabilities
only when a feature explicitly needs them. The browser policy is the correct
place to pre-approve the trusted production origin.

The current Chrome Enterprise policy names are:

- `PreciseGeolocationAllowedForUrls` for high-accuracy geolocation
- `AudioCaptureAllowedUrls` for microphone capture
- `VideoCaptureAllowedUrls` for camera capture

These are origin allowlists. The official policy documentation specifies the
Linux managed-policy names and list format for [precise geolocation](https://chromeenterprise.google/policies/precise-geolocation-allowed-for-urls/),
[audio capture](https://chromeenterprise.google/policies/audio-capture-allowed-urls/),
and [video capture](https://chromeenterprise.google/policies/video-capture-allowed-urls/).

For the `/usr/bin/chromium` package used by the launcher, create the managed
policy directory and file:

```bash
sudo install -d -m 0755 /etc/chromium/policies/managed
sudo tee /etc/chromium/policies/managed/cosmic-kiosk.json >/dev/null <<'EOF'
{
  "PreciseGeolocationAllowedForUrls": ["https://cosmicpudge.shop"],
  "AudioCaptureAllowedUrls": ["https://cosmicpudge.shop"],
  "VideoCaptureAllowedUrls": ["https://cosmicpudge.shop"]
}
EOF
sudo chmod 0644 /etc/chromium/policies/managed/cosmic-kiosk.json
```

Restart Chromium after installing the policy. Confirm it is loaded at
`chrome://policy` and use **Reload policies** when testing. If a distribution
uses the legacy `chromium-browser` package instead, use its corresponding
managed-policy directory and verify the result in that browser's
`chrome://policy` page; do not install a global allow policy.

The policy grants only this Cosmic origin. It does not use
`--use-fake-ui-for-media-stream`, does not grant arbitrary websites access,
and does not override the application rule that missing camera, microphone, or
location hardware is a normal unavailable capability.

## Touch alignment diagnostics

Cosmic's first-run display setup can verify that browser pointer events land
near its visible touch targets, but a website cannot recalibrate Linux
touchscreen hardware. If the target test shows a consistent offset, calibrate
the touchscreen through the Raspberry Pi's Wayland/libinput configuration or
the display vendor's supported tooling, then restart the kiosk. Do not attempt
to rewrite libinput or labwc configuration from the web application.

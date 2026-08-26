# Raspberry Pi Cosmic Kiosk Setup

Run these commands on the Raspberry Pi as `cosmicpudge`. This repository does
not modify the Pi filesystem and does not provide hardware-control endpoints.

## Create the launcher

```bash
mkdir -p ~/.local/bin ~/.config/systemd/user ~/.config/cosmic-kiosk
cat > ~/.local/bin/cosmic-kiosk <<'EOF'
#!/bin/bash
set -eu
COSMIC_URL="https://cosmicpudge.shop/os/kiosk?cosmic-kiosk=1"
sleep 5
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

The kiosk adapts from the browser viewport, shared Cosmic display profile, and
input capabilities. It does not use Raspberry Pi user-agent detection.

## Development simulator

The simulator is development-only and must not synthesize production data:

```text
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=none
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=nfl
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=mlb
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=f1
/os/kiosk?cosmic-kiosk=1&kiosk-sport-test=nascar
```

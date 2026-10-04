#!/usr/bin/env python3
"""Loopback-only renderer heartbeat watchdog for the physical Cosmic kiosk."""

from __future__ import annotations

import argparse
import http.server
import logging
import subprocess
import threading
import time
from dataclasses import dataclass


LOG = logging.getLogger("cosmic-watchdog")


@dataclass
class WatchdogState:
    stale_after: float = 45.0
    confirm_after: float = 10.0
    cooldown: float = 180.0
    startup_grace: float = 90.0
    started_at: float = 0.0
    last_heartbeat: float | None = None
    stale_since: float | None = None
    last_restart: float | None = None

    def heartbeat(self, now: float) -> None:
        was_stale = self.stale_since is not None
        self.last_heartbeat = now
        self.stale_since = None
        if was_stale:
            LOG.info("heartbeat healthy")

    def tick(self, now: float) -> bool:
        if self.last_heartbeat is None:
            age = now - self.started_at
        else:
            age = now - self.last_heartbeat
        if age < self.stale_after:
            return False
        if self.stale_since is None:
            self.stale_since = now
            LOG.warning("heartbeat stale age=%ss", int(age))
            return False
        if now - self.stale_since < self.confirm_after:
            return False
        if self.last_restart is not None and now - self.last_restart < self.cooldown:
            return False
        self.last_restart = now
        self.stale_since = None
        self.last_heartbeat = None
        self.started_at = now
        return True


class HeartbeatHandler(http.server.BaseHTTPRequestHandler):
    watchdog: "KioskWatchdog"

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/heartbeat":
            self.send_error(http.HTTPStatus.NOT_FOUND)
            return
        self.watchdog.heartbeat()
        self.send_response(http.HTTPStatus.NO_CONTENT)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def log_message(self, _format: str, *_args: object) -> None:
        return


class KioskWatchdog:
    def __init__(self, service: str, state: WatchdogState) -> None:
        self.service = service
        self.state = state
        self.lock = threading.Lock()

    def heartbeat(self) -> None:
        with self.lock:
            self.state.heartbeat(time.monotonic())

    def monitor(self) -> None:
        while True:
            time.sleep(5)
            with self.lock:
                restart = self.state.tick(time.monotonic())
            if restart:
                LOG.warning("recovery restarting %s", self.service)
                try:
                    subprocess.run(["/usr/bin/systemctl", "--user", "restart", self.service], check=True, timeout=30)
                except (OSError, subprocess.SubprocessError) as error:
                    LOG.error("recovery failed category=%s", type(error).__name__)
                else:
                    LOG.info("recovery complete")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--service", default="cosmic-kiosk.service")
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--stale-after", type=float, default=45.0)
    parser.add_argument("--confirm-after", type=float, default=10.0)
    parser.add_argument("--cooldown", type=float, default=180.0)
    args = parser.parse_args()
    state = WatchdogState(stale_after=args.stale_after, confirm_after=args.confirm_after, cooldown=args.cooldown, started_at=time.monotonic())
    watchdog = KioskWatchdog(args.service, state)
    handler = type("BoundHeartbeatHandler", (HeartbeatHandler,), {"watchdog": watchdog})
    server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    threading.Thread(target=watchdog.monitor, daemon=True).start()
    LOG.info("watchdog listening loopback port=%s stale_after=%ss confirm_after=%ss cooldown=%ss", args.port, int(args.stale_after), int(args.confirm_after), int(args.cooldown))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    main()

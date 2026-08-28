#!/usr/bin/env python3
"""Minimal loopback helper for a physical Cosmic Display.

The permanent credential is read only by this process. It is never returned by
the helper and is never sent to browser JavaScript.
"""
import json
import hashlib
import os
import secrets
import tempfile
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

STATE_FILE = Path(os.environ.get("COSMIC_DISPLAY_STATE_FILE", "/var/lib/cosmic-display/device.json"))
SERVER_URL = os.environ.get("COSMIC_SERVER_URL", "https://cosmicpudge.shop").rstrip("/")
LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = int(os.environ.get("COSMIC_HELPER_PORT", "8765"))
ALLOWED_ORIGIN = os.environ.get("COSMIC_HELPER_ORIGIN", SERVER_URL)
ALLOWED_HOST = f"{LISTEN_HOST}:{LISTEN_PORT}"
MAX_REQUEST_BYTES = 4096


def module_value(state, name):
    return state.get("module", {}).get(name) if isinstance(state.get("module"), dict) else state.get(name)


def credential_value(state):
    return state.get("authentication", {}).get("credential") if isinstance(state.get("authentication"), dict) else state.get("credential")


def read_state():
    try:
        state = json.loads(STATE_FILE.read_text())
        if not isinstance(state, dict) or state.get("schema", state.get("version")) != 1:
            return None
        if not module_value(state, "deviceId") or not module_value(state, "publicNumber"):
            return None
        return state
    except (OSError, ValueError):
        return None


def write_state(state):
    """Persist state without exposing a partially written credential file."""
    if "module" not in state:
        state["module"] = {"deviceId": state.pop("deviceId", None), "publicNumber": state.pop("publicNumber", None)}
    if "authentication" not in state:
        state["authentication"] = {"credential": state.pop("credential", None)}
    state["version"] = 1
    state.pop("schema", None)
    STATE_FILE.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(STATE_FILE.parent, 0o700)
    descriptor, temporary = tempfile.mkstemp(prefix=".device.", dir=STATE_FILE.parent)
    try:
        os.fchmod(descriptor, 0o600)
        payload = (json.dumps(state, separators=(",", ":")) + "\n").encode()
        os.write(descriptor, payload)
        os.fsync(descriptor)
        os.close(descriptor)
        os.replace(temporary, STATE_FILE)
    except Exception:
        os.close(descriptor)
        try:
            os.unlink(temporary)
        except OSError:
            pass
        raise


def boot_id():
    try:
        return Path("/proc/sys/kernel/random/boot_id").read_text().strip()
    except OSError:
        return os.environ.get("COSMIC_BOOT_ID", "")


def post_json(path, body, credential=None):
    headers = {"Content-Type": "application/json", "Cache-Control": "no-store"}
    if credential:
        headers["Authorization"] = f"Bearer {credential}"
    request = urllib.request.Request(f"{SERVER_URL}{path}", json.dumps(body).encode(), headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        try:
            body = json.loads(error.read().decode())
            if isinstance(body, dict):
                return error.code, body
        except (OSError, ValueError, json.JSONDecodeError):
            pass
        return error.code, {"error": "server_error"}
    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        return getattr(error, "code", 503), {"error": "server_unavailable"}


def clear_owner_authentication(state):
    authentication = state.setdefault("authentication", {})
    authentication.pop("credential", None)
    state.pop("credential", None)
    state.pop("enrollment", None)


def classify_handoff_failure(status, response):
    state = response.get("state") if isinstance(response, dict) else None
    if state == "needs_provisioning":
        return "needs_provisioning"
    if state == "identity_recovery":
        return "identity_recovery"
    return "reconnecting"


def apply_handoff_failure(state, status, response):
    lifecycle = classify_handoff_failure(status, response)
    if lifecycle == "needs_provisioning":
        clear_owner_authentication(state)
        write_state(state)
    return lifecycle


def resolve_credentialless_state(state):
    status, response = post_json("/api/devices/lifecycle", {"deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber")})
    lifecycle = response.get("state") if isinstance(response, dict) else None
    if lifecycle == "identity_recovery":
        return "identity_recovery"
    if status != 200:
        return "reconnecting"
    if lifecycle == "needs_provisioning" and response.get("pairingRequired") is True:
        return "needs_provisioning"
    if lifecycle == "recovery_required":
        return "recovery_required"
    return "reconnecting"


def start_enrollment(state):
    enrollment = state.get("enrollment") if isinstance(state.get("enrollment"), dict) else None
    if enrollment and enrollment.get("challengeId") and enrollment.get("challenge") and enrollment.get("credential"):
        return enrollment
    challenge = secrets.token_urlsafe(32)
    status, response = post_json("/api/devices/enrollment/challenge", {"deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber"), "challenge": challenge})
    if status != 200:
        return None
    enrollment = {"challengeId": response["challengeId"], "challenge": challenge, "credential": secrets.token_urlsafe(32), "expiresAt": response["expiresAt"]}
    state["enrollment"] = enrollment
    write_state(state)
    return enrollment


def finish_enrollment(state, enrollment):
    status, grant = post_json("/api/devices/enrollment/grant", {"challengeId": enrollment["challengeId"], "challenge": enrollment["challenge"]})
    if status != 200 or not grant.get("approved"):
        return False
    status, staged = post_json("/api/devices/enrollment/stage", {"challengeId": enrollment["challengeId"], "challenge": enrollment["challenge"], "grant": grant.get("grant"), "credentialHash": hashlib.sha256(enrollment["credential"].encode()).hexdigest()})
    if status != 200 or not staged.get("staged"):
        return False
    status, result = post_json("/api/devices/enrollment/redeem", {"challengeId": enrollment["challengeId"], "challenge": enrollment["challenge"], "grant": grant.get("grant"), "credential": enrollment["credential"]})
    if status != 200 or not result.get("finalized"):
        return False
    state.setdefault("authentication", {})["credential"] = enrollment["credential"]
    state.pop("credential", None)
    state.pop("enrollment", None)
    write_state(state)
    return True


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, body):
        encoded = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_OPTIONS(self):
        if self.headers.get("Host") != ALLOWED_HOST or self.headers.get("Origin") not in (None, ALLOWED_ORIGIN):
            self._send(403, {"error": "origin_not_allowed"})
            return
        self._send(204, {})

    def do_GET(self):
        if self.headers.get("Host") != ALLOWED_HOST:
            self._send(403, {"error": "host_not_allowed"})
            return
        if self.path != "/v1/status":
            self._send(404, {"error": "not_found"})
            return
        state = read_state()
        self._send(200, {"state": "needs_provisioning" if state and not credential_value(state) else ("identity_recovery" if not state else "ready"), "deviceId": module_value(state, "deviceId") if state else None, "publicNumber": module_value(state, "publicNumber") if state else None, "hasCredential": bool(state and credential_value(state))})

    def do_POST(self):
        if self.headers.get("Host") != ALLOWED_HOST or self.headers.get("Origin") not in (None, ALLOWED_ORIGIN):
            self._send(403, {"error": "origin_not_allowed"})
            return
        if self.path != "/v1/browser-handoff":
            self._send(404, {"error": "not_found"})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 0 or size > MAX_REQUEST_BYTES:
                self._send(413, {"error": "request_too_large"})
                return
            body = json.loads(self.rfile.read(size).decode())
        except (ValueError, json.JSONDecodeError):
            self._send(400, {"error": "invalid_request"})
            return
        requested_boot = body.get("bootId") if isinstance(body, dict) else None
        current_boot = boot_id()
        if not requested_boot or requested_boot != current_boot:
            self._send(400, {"error": "boot_id_mismatch"})
            return
        state = read_state()
        if not state:
            self._send(409, {"state": "identity_recovery"})
            return
        credential = credential_value(state)
        if not credential:
            lifecycle = resolve_credentialless_state(state)
            if lifecycle == "needs_provisioning":
                self._send(200, {"state": "needs_provisioning", "deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber"), "pairingRequired": True})
                return
            if lifecycle == "identity_recovery":
                self._send(409, {"state": "identity_recovery"})
                return
            if lifecycle == "reconnecting":
                self._send(503, {"state": "reconnecting"})
                return
            enrollment = start_enrollment(state)
            if not enrollment:
                self._send(503, {"state": "reconnecting"})
                return
            if finish_enrollment(state, enrollment):
                credential = credential_value(state)
            else:
                self._send(409, {"state": "needs_provisioning", "deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber"), "challengeId": enrollment["challengeId"], "activationUrl": f"{SERVER_URL}/activate/recover?challenge={enrollment['challengeId']}"})
                return
        status, response = post_json("/api/devices/handoff", {"bootId": current_boot, "deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber")}, credential)
        if status != 200:
            lifecycle = apply_handoff_failure(state, status, response)
            self._send(409 if lifecycle in ("needs_provisioning", "identity_recovery") else 503, {"state": lifecycle, "deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber"), **({"pairingRequired": True} if lifecycle == "needs_provisioning" else {})})
            return
        self._send(200, {"state": "ready", "deviceId": response.get("deviceId"), "handoffToken": response.get("handoffToken")})

    def log_message(self, *_args):
        return


def main():
    os.umask(0o077)
    server = ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()

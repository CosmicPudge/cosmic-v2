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
import subprocess
import time
import sys
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
MAINTENANCE_ACTIONS = {
    "check-system-updates",
    "install-system-updates",
    "restart-kiosk",
    "reload-kiosk",
    "reboot",
}
maintenance_state = {"state": "idle", "lastAttemptAt": None, "lastSuccessAt": None, "lastFailureCategory": None}


def helper_log(message):
    print(f"[cosmic-helper] {message}", file=sys.stderr, flush=True)


def validate_browser_handoff_body(body, current_boot):
    if not isinstance(body, dict):
        return "invalid_body"
    requested_boot = body.get("bootId")
    if not requested_boot:
        return "missing_boot_id"
    if requested_boot != current_boot:
        return "boot_id_mismatch"
    return "ok"


def origin_allowed(origin):
    return origin in (None, ALLOWED_ORIGIN)


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


def reboot_required():
    return Path("/var/run/reboot-required").exists()


def normalize_update_check(output):
    lines = output.splitlines()
    updates = [line for line in lines if line.startswith("Inst ")]
    security = [line for line in updates if "security" in line.lower()]
    return {"updatesAvailable": len(updates), "securityUpdates": len(security), "rebootRequired": reboot_required()}


def run_maintenance_action(action, credential, expected_credential):
    """Run only fixed, named maintenance operations; no client command is accepted."""
    if action not in MAINTENANCE_ACTIONS:
        return {"state": "failed", "errorCategory": "action-not-allowed"}
    if not credential or not expected_credential or not secrets.compare_digest(credential, expected_credential):
        return {"state": "failed", "errorCategory": "device-authorization-failed"}
    maintenance_state["lastAttemptAt"] = int(time.time())
    maintenance_state["lastFailureCategory"] = None
    if action == "check-system-updates":
        maintenance_state["state"] = "checking"
        try:
            completed = subprocess.run(["/usr/bin/apt-get", "-s", "upgrade"], capture_output=True, text=True, timeout=20, check=False)
            if completed.returncode != 0:
                raise RuntimeError("package-check-failed")
            result = normalize_update_check(completed.stdout)
            maintenance_state.update({"state": "available" if result["updatesAvailable"] else "idle", "lastSuccessAt": int(time.time())})
            return {"state": maintenance_state["state"], "checkedAt": maintenance_state["lastAttemptAt"], **result}
        except subprocess.TimeoutExpired:
            maintenance_state.update({"state": "failed", "lastFailureCategory": "timeout"})
            return {"state": "failed", "errorCategory": "timeout"}
        except (OSError, RuntimeError):
            maintenance_state.update({"state": "failed", "lastFailureCategory": "package-check-failed"})
            return {"state": "failed", "errorCategory": "package-check-failed"}
    # Installation/reboot actions are explicit protocol members but remain
    # unavailable until a separately privileged maintenance unit is installed.
    maintenance_state.update({"state": "failed", "lastFailureCategory": "privileged-helper-unavailable"})
    return {"state": "failed", "errorCategory": "privileged-helper-unavailable"}


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


def complete_initial_enrollment(state, pairing_code, boot_id_value):
    credential = secrets.token_urlsafe(32)
    status, response = post_json("/api/devices/pair/initial-enroll", {"deviceCode": pairing_code, "bootId": boot_id_value, "deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber"), "credentialHash": hashlib.sha256(credential.encode()).hexdigest()})
    if status != 200 or not isinstance(response, dict) or response.get("enrolled") is not True:
        return None
    state.setdefault("authentication", {})["credential"] = credential
    state.pop("credential", None)
    state.pop("enrollment", None)
    write_state(state)
    return credential


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
        if self.headers.get("Host") != ALLOWED_HOST or not origin_allowed(self.headers.get("Origin")):
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
        if self.headers.get("Host") != ALLOWED_HOST or not origin_allowed(self.headers.get("Origin")):
            self._send(403, {"error": "origin_not_allowed"})
            return
        if self.path == "/v1/browser-handoff":
            helper_log("browser_handoff requested")
        elif self.path == "/v1/maintenance":
            helper_log("maintenance requested")
        if self.path not in ("/v1/browser-handoff", "/v1/maintenance"):
            self._send(404, {"error": "not_found"})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size < 0 or size > MAX_REQUEST_BYTES:
                self._send(413, {"error": "request_too_large"})
                return
            body = json.loads(self.rfile.read(size).decode())
        except (ValueError, json.JSONDecodeError):
            if self.path == "/v1/browser-handoff": helper_log("browser_handoff validation=failed reason=invalid_body")
            self._send(400, {"error": "invalid_request"})
            return
        if self.path == "/v1/maintenance":
            state = read_state()
            credential = self.headers.get("Authorization", "")
            credential = credential[7:] if credential.startswith("Bearer ") else ""
            action = body.get("action") if isinstance(body, dict) else None
            if not isinstance(action, str):
                self._send(400, {"error": "action_required"})
                return
            result = run_maintenance_action(action, credential, credential_value(state) if state else None)
            self._send(200 if result.get("errorCategory") is None else (403 if result.get("errorCategory") == "device-authorization-failed" else 503), result)
            return
        requested_boot = body.get("bootId") if isinstance(body, dict) else None
        pairing_code = body.get("pairingCode") if isinstance(body, dict) else None
        current_boot = boot_id()
        validation = validate_browser_handoff_body(body, current_boot)
        if validation != "ok":
            helper_log(f"browser_handoff validation=failed reason={validation}")
            self._send(400, {"error": "boot_id_mismatch"})
            return
        state = read_state()
        if not state:
            helper_log("browser_handoff validation=ok lifecycle=identity_recovery")
            self._send(409, {"state": "identity_recovery"})
            return
        helper_log("browser_handoff validation=ok")
        credential = credential_value(state)
        if not credential:
            if isinstance(pairing_code, str) and pairing_code:
                credential = complete_initial_enrollment(state, pairing_code, current_boot)
                if credential:
                    helper_log("server_handoff requested")
                    status, response = post_json("/api/devices/handoff", {"bootId": current_boot, "deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber")}, credential)
                    helper_log(f"server_handoff status={status} state={response.get('state', 'ready' if status == 200 else 'unknown')} tokenIssued={status == 200 and bool(response.get('handoffToken'))}")
                    if status != 200:
                        lifecycle = apply_handoff_failure(state, status, response)
                        self._send(409 if lifecycle in ("needs_provisioning", "identity_recovery") else 503, {"state": lifecycle, "deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber"), **({"pairingRequired": True} if lifecycle == "needs_provisioning" else {})})
                        return
                    self._send(200, {"state": "ready", "deviceId": response.get("deviceId"), "handoffToken": response.get("handoffToken")})
                    helper_log("browser_handoff response=200")
                    return
                self._send(503, {"state": "reconnecting"})
                return
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
        helper_log("server_handoff requested")
        status, response = post_json("/api/devices/handoff", {"bootId": current_boot, "deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber")}, credential)
        helper_log(f"server_handoff status={status} state={response.get('state', 'ready' if status == 200 else 'unknown')} tokenIssued={status == 200 and bool(response.get('handoffToken'))}")
        if status != 200:
            lifecycle = apply_handoff_failure(state, status, response)
            self._send(409 if lifecycle in ("needs_provisioning", "identity_recovery") else 503, {"state": lifecycle, "deviceId": module_value(state, "deviceId"), "publicNumber": module_value(state, "publicNumber"), **({"pairingRequired": True} if lifecycle == "needs_provisioning" else {})})
            return
        self._send(200, {"state": "ready", "deviceId": response.get("deviceId"), "handoffToken": response.get("handoffToken")})
        helper_log("browser_handoff response=200")

    def log_message(self, *_args):
        return


def main():
    os.umask(0o077)
    server = ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()

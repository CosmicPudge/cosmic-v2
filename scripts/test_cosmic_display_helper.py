import importlib.util
import tempfile
import unittest
from pathlib import Path


HELPER_PATH = Path(__file__).with_name("cosmic_display_helper.py")
SPEC = importlib.util.spec_from_file_location("cosmic_display_helper", HELPER_PATH)
HELPER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HELPER)


class HelperLifecycleTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        HELPER.STATE_FILE = Path(self.temp_dir.name) / "device.json"
        self.state = {
            "schema": 1,
            "module": {"deviceId": "test-device", "publicNumber": "TEST-000001"},
            "authentication": {"credential": "synthetic-credential"},
            "enrollment": {"challenge": "synthetic-enrollment-state"},
        }

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_valid_identity_and_credential_is_ready(self):
        HELPER.write_state(self.state)
        loaded = HELPER.read_state()
        self.assertEqual(HELPER.module_value(loaded, "deviceId"), "test-device")
        self.assertEqual(HELPER.credential_value(loaded), "synthetic-credential")

    def test_authoritative_revocation_clears_auth_only(self):
        result = HELPER.apply_handoff_failure(self.state, 409, {"state": "needs_provisioning"})
        self.assertEqual(result, "needs_provisioning")
        self.assertEqual(self.state["module"], {"deviceId": "test-device", "publicNumber": "TEST-000001"})
        self.assertNotIn("credential", self.state["authentication"])
        self.assertNotIn("enrollment", self.state)

    def test_server_offline_preserves_credential(self):
        result = HELPER.apply_handoff_failure(self.state, 503, {"error": "server_unavailable"})
        self.assertEqual(result, "reconnecting")
        self.assertEqual(HELPER.credential_value(self.state), "synthetic-credential")

    def test_identity_recovery_does_not_clear_credential(self):
        result = HELPER.apply_handoff_failure(self.state, 409, {"state": "identity_recovery"})
        self.assertEqual(result, "identity_recovery")
        self.assertEqual(HELPER.credential_value(self.state), "synthetic-credential")

    def test_revocation_is_idempotent(self):
        self.assertEqual(HELPER.apply_handoff_failure(self.state, 409, {"state": "needs_provisioning"}), "needs_provisioning")
        self.assertEqual(HELPER.apply_handoff_failure(self.state, 409, {"state": "needs_provisioning"}), "needs_provisioning")
        self.assertEqual(self.state["module"]["publicNumber"], "TEST-000001")

    def test_failure_payload_has_no_secret_fields(self):
        self.assertNotIn("credential", {"state": HELPER.classify_handoff_failure(503, {"error": "server_unavailable"})})
        self.assertNotIn("token", {"state": "needs_provisioning", "deviceId": "test-device"})


if __name__ == "__main__":
    unittest.main()

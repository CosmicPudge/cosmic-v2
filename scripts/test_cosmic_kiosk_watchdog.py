import unittest

from cosmic_kiosk_watchdog import WatchdogState


class WatchdogStateTests(unittest.TestCase):
    def test_healthy_heartbeat_does_not_restart(self):
        state = WatchdogState(started_at=0)
        state.heartbeat(10)
        self.assertFalse(state.tick(50))

    def test_one_missed_heartbeat_waits_for_confirmation(self):
        state = WatchdogState(started_at=0)
        state.heartbeat(0)
        self.assertFalse(state.tick(46))
        self.assertFalse(state.tick(50))

    def test_sustained_stale_heartbeat_restarts_once(self):
        state = WatchdogState(started_at=0, cooldown=180)
        state.heartbeat(0)
        self.assertFalse(state.tick(46))
        self.assertTrue(state.tick(56))
        self.assertFalse(state.tick(100))

    def test_heartbeat_return_cancels_recovery(self):
        state = WatchdogState(started_at=0)
        state.heartbeat(0)
        self.assertFalse(state.tick(46))
        state.heartbeat(50)
        self.assertFalse(state.tick(60))

    def test_cooldown_prevents_restart_storm(self):
        state = WatchdogState(started_at=0, cooldown=180)
        state.heartbeat(0)
        self.assertFalse(state.tick(46))
        self.assertTrue(state.tick(56))
        state.stale_since = 180
        self.assertFalse(state.tick(200))


if __name__ == "__main__":
    unittest.main()

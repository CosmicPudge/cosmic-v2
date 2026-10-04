# Football kiosk soak test

Run the dev football fixture, for example `/kiosk?sport=cfb&team=usu&state=live&football=stats`, on the Raspberry Pi in Chromium and leave it visible for 3–4 hours.

During the run, watch Chromium memory, CPU, frame smoothness, request count, fetch failures, console warnings, and whether the venue image reloads when the lifecycle changes. Confirm that score updates animate only after a real update, stale responses do not blank the scene, and manual kiosk navigation remains responsive.

For a deterministic CI check, run:

```sh
node --import tsx --test services/sports/football/soakSimulation.test.ts
```

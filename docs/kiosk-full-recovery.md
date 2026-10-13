# Full Cosmos kiosk recovery (in progress)

Source of truth: `codex/cosmos-kiosk`.
Target: current `dev` without wholesale replacement of app/auth/settings modules.
**Do not deploy or merge this recovery branch before visual and runtime approval.**

## Source scene inventory
The source slideshow currently registers: clock, weather, calendar (PCAL), school-calendar (SCAL), sports, music, garage, notes, tasks, cosmic-ai, system.

## Recovery gates
- [ ] Port slide shell, scene components, hooks and server data contracts, keeping `dev` integrations where compatible
- [ ] Confirm notification scene requirement; source `BUILD_SLIDES` currently does not register a separate notifications scene
- [ ] Check calendar/school data isolation and access rules
- [ ] Verify desktop fullscreen, slide timing, manual navigation and playback takeover
- [ ] Test all scenes and fallbacks on isolated preview
- [ ] Verify no unrelated app/auth/settings replacements and no changes to M1
- [ ] Explicit user approval before merging to `dev`

The purpose of this document is to anchor the recovery branch. It does not indicate working kiosk functionality.

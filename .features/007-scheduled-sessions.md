# 007 — Independent scheduled sessions

- **Phase:** Sessions
- **Dependencies:** 001–005
- **Goal:** Give each named session its own daily window, blocked sites, and mode without losing existing settings.
- **Deliverable:** Migrated settings model, session actions, union blocking, and session management UI.

## Completion criteria

- [x] Migrate the former single window and site list into one session without data loss.
- [x] Create, rename, edit, pause, resume, and remove scheduled sessions with valid local times and site lists.
- [x] Apply per-session Normal/Hardcore rules, including an in-app lock only for the active Hardcore session.
- [x] Combine blocked sites from overlapping active sessions and keep existing-tab handling aligned with the union.
- [ ] Verify migration, overlaps, boundaries, independent controls, and browser restart with meaningful tests and browser scenarios.

Automated checks cover the model and transitions. Browser scenarios remain open because Chrome cannot launch in this environment.

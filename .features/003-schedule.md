# 003 — Daily schedule

- **Phase:** Scheduling
- **Dependencies:** 001
- **Goal:** Calculate and display whether the single recurring daily window is active in local time.
- **Deliverable:** Start/end time controls, persisted schedule, transition alarms, and startup reconciliation.

## Completion criteria

- [x] Save a valid start and end time, with a clear rule for equal times.
- [x] Calculate active status with inclusive start, exclusive end, and midnight crossing.
- [x] Schedule the next transition with `chrome.alarms` and recreate/reconcile alarms on startup and configuration changes.
- [x] Expose the current status and next transition time to popup and options UI.
- [ ] Verify before/at/after each boundary, midnight crossing, and browser restart during an active window.

Automated tests cover boundaries, midnight, and controller restart. A live Chrome restart remains unverified because Chrome cannot launch in this environment.

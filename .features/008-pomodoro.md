# 008 — Pomodoro timer

- **Phase:** Pomodoro
- **Dependencies:** 007
- **Goal:** Let users run configurable focus/break cycles that block a dedicated site list during focus.
- **Deliverable:** Persistent timer model, controls, countdown UI, alarms, and union blocking with scheduled sessions.

## Completion criteria

- [x] Configure focus and break lengths and a Pomodoro-specific blocked-site list.
- [x] Start, pause, resume, and stop an automatically alternating focus/break timer.
- [ ] Reconcile the timer after popup closure, service worker sleep, and browser restart using saved timestamps.
- [x] Block Pomodoro sites only during running focus; combine with independently active scheduled-session rules.
- [x] Enforce the proposed Normal/Hardcore timer behavior and explain the lock clearly in the UI.
- [ ] Verify countdown boundaries, cycles, restart, controls, and site blocking with tests and browser scenarios.

Timestamp persistence and controller restart are covered in automated checks. Live popup, worker sleep, and browser restart checks remain open because Chrome cannot launch in this environment.

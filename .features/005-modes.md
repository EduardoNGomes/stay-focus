# 005 — Normal and Hardcore modes

- **Phase:** Modes
- **Dependencies:** 002, 003, 004
- **Goal:** Provide an interruptible Normal mode and an in-app commitment lock for Hardcore.
- **Deliverable:** Mode selection, Normal pause/resume, Hardcore control restrictions, and accurate status/limit messaging.

## Completion criteria

- [x] Let users choose Normal or Hardcore outside an active Hardcore window.
- [x] In Normal, pause and resume blocking at any time; clear a pause at the end of its current window.
- [x] During an active Hardcore window, reject in-app pause, mode change, schedule edits, and blocked-site removal in the underlying action handlers as well as the UI.
- [x] Show the lock end time and explain before selection that Chrome can still disable/remove the extension, which stops blocking.
- [ ] Verify mode and pause transitions, rejected Hardcore actions, and persistence across popup closure and browser restart.

Automated controller tests cover transitions and rejected actions. Popup closure and browser restart require live Chrome verification.

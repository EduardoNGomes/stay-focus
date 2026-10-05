# 006 — Release readiness

- **Phase:** Release readiness
- **Dependencies:** 001, 002, 003, 004, 005
- **Goal:** Make the extension reviewable and usable as an unpacked Chrome extension.
- **Deliverable:** Verified browser scenarios and concise setup, use, and limitation documentation.

## Completion criteria

- [ ] Run the plan's manual Chrome scenarios for site input, subdomains, already-open tabs, active/inactive blocking, midnight crossing, restart, Normal pause, and Hardcore restrictions.
- [ ] Check keyboard navigation, readable status/errors, focus visibility, and reduced-motion behavior in popup, options, and blocked page.
- [x] Review requested permissions and confirm they match the shipped behavior.
- [x] Document how to load the unpacked extension and operate each mode.
- [x] Document that disabling or removing the extension in Chrome stops blocking, including in Hardcore.
- [x] Record known platform limits and the blocked browser-verification status.

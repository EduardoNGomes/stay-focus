# 001 — Extension foundation

- **Phase:** Foundation
- **Dependencies:** None
- **Goal:** Establish the Chrome extension structure, persisted configuration, and MDO based interface foundations.
- **Deliverable:** Loadable Manifest V3 extension with a popup, options page, service worker, local configuration model, and packaged MDO styles.

## Completion criteria

- [x] Define the Manifest V3 entry points and only the permissions required by the planned features.
- [x] Define defaults and storage access for the site list, daily window, mode, and Normal pause state.
- [x] Build accessible popup and options page shells with status and navigation placeholders.
- [x] Package the relevant MDO tokens/components locally and adapt them for popup and options layouts.
- [ ] Verify the unpacked extension loads in Chrome and both pages render with keyboard focus and reduced-motion behavior.

Browser verification remains unchecked because Chrome exits with a socket permission error in the current environment. Static manifest/page reference checks, JavaScript syntax checks, and a mocked storage check passed.

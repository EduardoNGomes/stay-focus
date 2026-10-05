# 002 — Blocked site list

- **Phase:** Configuration
- **Dependencies:** 001
- **Goal:** Let users maintain a valid list of sites to block.
- **Deliverable:** Add, list, and remove sites in the options page, with normalized hostnames saved locally.

## Completion criteria

- [x] Accept a hostname or HTTP/HTTPS URL and normalize it to a hostname.
- [x] Reject malformed entries, unsupported schemes, and duplicates with useful feedback.
- [x] Show saved sites and allow removal when the mode permits it.
- [x] Define host and subdomain matching semantics for feature 004.
- [ ] Verify normalization, duplicates, persistence after reopening the UI, and removal through meaningful tests or manual scenarios.

Automated tests cover normalization, duplicates, persistence across controller restart, and removal. Reopening the Chrome UI remains unverified.

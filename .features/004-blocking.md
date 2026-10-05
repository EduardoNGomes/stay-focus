# 004 — Scheduled site blocking

- **Phase:** Blocking
- **Dependencies:** 002, 003
- **Goal:** Block listed sites during the active window in Chrome.
- **Deliverable:** Dynamic `chrome.declarativeNetRequest` rules for top-level HTTP/HTTPS navigation, reconciled with saved sites and schedule.

## Completion criteria

- [x] Generate rules using Chrome's `requestDomains` match, which includes the hostname and subdomains.
- [x] Add, update, and remove rules as the list or active schedule changes.
- [x] Reconcile dynamic rules after browser startup and service worker wakeup.
- [x] Move already-open matching tabs to a Stay Focus page; keep Chrome's standard blocked response for network requests that Chrome does not move to that page.
- [ ] Verify blocked and allowed navigation for root domains, subdomains, unrelated domains, HTTP/HTTPS, schedule transitions, and restart.

Rule creation, transitions, and already-open tab handling pass mocked API tests. Actual Chrome navigation is pending browser access.

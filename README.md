# Stay Focus

A Chrome extension that blocks chosen websites during recurring daily sessions or Pomodoro focus intervals. Settings stay on this device. The UI uses bundled styles from the local MDO Design System in `src/vendor/mdo/`, with its license included there.

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked** and choose this project directory, the folder containing `manifest.json`.
4. Pin **Stay Focus** to the toolbar for quick access. After updating the files, select **Reload** in Chrome's extension manager.

## Daily sessions

Create any number of named sessions in Settings (up to 50). Each has its own daily start and end times, mode, and website list. Enter a domain or HTTP/HTTPS URL; `example.com` covers that hostname and its subdomains. Duplicate entries in the same list are rejected. Sites shared by overlapping sessions stay blocked until every active session that includes them ends or pauses.

Times use your local timezone. Sessions repeat every day and can cross midnight, such as `22:00–02:00`. Start is included and end is excluded. Equal times are invalid. Existing single-window settings are migrated into one session automatically.

**Normal** sessions can be paused and resumed in the popup or Settings. A pause lasts through the current daily window, or the next window if paused before it starts. **Hardcore** locks that session's edit, delete, pause, and site-removal controls while its window is active. Other sessions remain independent. Sites may still be added to an active Hardcore session.

## Pomodoro

Pomodoro has its **own website list**. Set focus and break lengths from 1 to 240 minutes each (defaults: 25/5), then start the timer in Settings or the popup. The countdown alternates focus and break automatically. Pomodoro sites are blocked only during a running focus interval; breaks and pauses release them unless a daily session also blocks them. Closing the popup or restarting Chrome preserves the timer's place using saved timestamps.

In **Normal**, pause, resume, or stop whenever you want. Pausing freezes the countdown. In **Hardcore**, pause, stop, and site removal are locked during a running focus interval and become available during the break. Timer durations and mode can be changed while stopped.

**Hardcore is an in-extension commitment lock.** Disabling or removing Stay Focus through Chrome stops blocking.

## Blocking and limits

When blocking begins, already-open matching tabs move to a Stay Focus page. New top-level HTTP/HTTPS navigations are blocked by Chrome's network rules and may show either that page or Chrome's standard blocked response. The focus page keeps the original URL for an explicit return when the site becomes available.

- Rules cover top-level navigation in Chrome. Embedded frames, other apps, and other browsers are outside this scope.
- The `tabs` permission lets Stay Focus inspect current tab URLs so it can move already-open blocked sites out of view. URLs are not sent anywhere.
- Chrome's [Declarative Net Request API](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest) applies to requests that reach the network stack; a page served entirely from a site's own service worker or CacheStorage may bypass these rules.
- Chrome [alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms) can be delayed, especially around sleep. The service worker reconciles rules on startup, alarms, and UI requests. A boundary can therefore take a short time to apply.
- All settings are stored in `chrome.storage.local`. There is no account, sync, analytics, or server. Across all lists, up to 1,000 distinct sites can be stored.

## Development and verification

No build step or third-party runtime package is needed. Run `npm test`, `python3 -m json.tool manifest.json`, and `for file in src/*.js; do node --check "$file" || exit; done`.

For manual Chrome acceptance, reload the unpacked extension and check:

1. Confirm an existing single-window setup appears as one session with its sites and mode preserved.
2. Create two sessions with different hours and sites. Check each start/end boundary, overlap, shared domains, subdomains, and a window crossing midnight.
3. Confirm an already-open matching tab moves to the focus page when blocking begins, and a new matching navigation is blocked. An unrelated domain should work.
4. Pause and resume one Normal session while another continues blocking. Confirm the pause expires at the window end.
5. Confirm an active Hardcore session refuses its own pause, edit, deletion, and site removal, while another session remains editable.
6. Select Pomodoro sites, set short focus and break durations, and check focus blocking, break access, automatic repeat, pause, resume, and stop.
7. Restart Chrome with a running Pomodoro and confirm the phase and countdown resume from elapsed wall time. Check overlap with a daily session during a break.
8. Check Normal and Hardcore timer controls during focus and break.
9. Use popup, Settings, and the blocked page by keyboard. Check visible focus, error messages, and reduced motion.
10. Disable the extension in Chrome and confirm blocking stops, as intended.

This environment cannot launch Chrome for browser acceptance: headless Chrome exits before loading the extension with `setsockopt: Operation not permitted`. Automated checks pass; browser scenarios remain open in `.features/`.

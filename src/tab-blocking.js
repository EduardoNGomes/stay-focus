export function blockedHostForUrl(url, sites) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  return sites.some((site) => host === site || host.endsWith(`.${site}`)) ? host : null;
}

export function blockedPageUrl(runtime, originalUrl, host) {
  const page = new URL(runtime.getURL("blocked.html"));
  page.searchParams.set("site", host);
  page.searchParams.set("from", originalUrl);
  return page.href;
}

export async function moveBlockedTab(api, tabId, url, sites) {
  if (!Number.isInteger(tabId) || tabId < 0) return false;
  const host = blockedHostForUrl(url, sites);
  if (!host) return false;
  try {
    await api.tabs.update(tabId, { url: blockedPageUrl(api.runtime, url, host) });
  } catch {
    await api.tabs.reload(tabId);
  }
  return true;
}

export async function moveOpenBlockedTabs(api, sites) {
  const tabs = await api.tabs.query({});
  const results = await Promise.allSettled(tabs
    .filter((tab) => !tab.discarded)
    .map((tab) => moveBlockedTab(api, tab.id, tab.url, sites)));
  for (const result of results) {
    if (result.status === "rejected") console.warn("Stay Focus could not move a tab:", result.reason);
  }
}

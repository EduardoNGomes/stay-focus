const params = new URLSearchParams(location.search);
const site = params.get("site") || "this site";
const original = params.get("from");
const siteLabel = document.querySelector("#blocked-site");
const description = document.querySelector("#blocked-description");
const retry = document.querySelector("#retry");
const errorElement = document.querySelector("#error");
let refreshTimer;

siteLabel.textContent = site;

function validOriginal() {
  try {
    const target = new URL(original);
    return ["http:", "https:"].includes(target.protocol) && target.hostname.toLowerCase() === site ? target.href : null;
  } catch {
    return null;
  }
}

async function refresh() {
  const response = await chrome.runtime.sendMessage({ type: "getState" });
  if (!response?.ok) throw new Error(response?.error || "Could not read the focus window.");
  const { status } = response.state;
  const listed = status.blockedSites.some((entry) => site === entry || site.endsWith(`.${entry}`));
  const stillBlocked = status.blocking && listed;
  if (stillBlocked) {
    const next = status.nextTransitionAt
      ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(status.nextTransitionAt)
      : "later";
    description.textContent = `Take this time for what matters. The next focus check is at ${next}.`;
  } else {
    description.textContent = "This site is no longer blocked. You can return now.";
  }
  retry.disabled = stillBlocked || !validOriginal();
  clearTimeout(refreshTimer);
  if (status.nextTransitionAt) {
    refreshTimer = setTimeout(() => void refresh().catch(showError), Math.max(1000, status.nextTransitionAt - Date.now() + 100));
  }
}

function showError(error) {
  errorElement.textContent = error instanceof Error ? error.message : String(error);
  errorElement.hidden = false;
}

retry.addEventListener("click", () => {
  const target = validOriginal();
  if (target) location.assign(target);
});

document.querySelector("#open-options").addEventListener("click", () => {
  void chrome.runtime.openOptionsPage();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void refresh().catch(showError);
});

void refresh().catch(showError);

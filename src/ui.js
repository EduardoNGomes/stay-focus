export async function sendAction(type, details = {}) {
  const response = await chrome.runtime.sendMessage({ type, ...details });
  if (!response?.ok) throw new Error(response?.error || "The extension did not respond.");
  const state = response.state;
  if (state?.settings?.schemaVersion !== 2
    || !Array.isArray(state.settings.sessions)
    || !state.settings.pomodoro
    || !Array.isArray(state.status?.sessionStates)
    || !state.status.pomodoro
    || !Array.isArray(state.status.blockedSites)) {
    throw new Error("Stay Focus needs a reload after this update. Reload it at chrome://extensions, then reopen this page.");
  }
  return state;
}

export function formatClock(timestamp) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

export function formatDuration(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function statusText(state) {
  const { settings, status } = state;
  if (status.blocking) {
    const count = status.blockedSites.length;
    return { title: "Focus is on", description: `${count} ${count === 1 ? "site is" : "sites are"} blocked now. Next check: ${formatClock(status.nextTransitionAt)}.` };
  }
  const configuredSites = settings.sessions.some((session) => session.sites.length) || settings.pomodoro.sites.length;
  if (!configuredSites) return { title: "Add sites to begin", description: "Choose websites for a daily session or the Pomodoro timer." };
  if (status.pomodoro.state === "running" && status.pomodoro.phase === "break") {
    return { title: "Break time", description: `Pomodoro focus resumes at ${formatClock(status.pomodoro.nextTransitionAt)}.` };
  }
  return { title: "Ready for focus", description: status.nextTransitionAt
    ? `The next scheduled change is at ${formatClock(status.nextTransitionAt)}.`
    : "Start Pomodoro or create a daily session to begin blocking." };
}

export function showError(error) {
  const message = document.querySelector("#error");
  message.textContent = error instanceof Error ? error.message : String(error);
  message.hidden = false;
}

export function clearError() {
  const message = document.querySelector("#error");
  message.textContent = "";
  message.hidden = true;
}

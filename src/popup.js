import { getPomodoroState } from "./pomodoro.js";
import { clearError, formatClock, formatDuration, sendAction, showError, statusText } from "./ui.js";

let currentState;
let refreshTimer;

async function act(type, details = {}) {
  clearError();
  try {
    render(await sendAction(type, details));
  } catch (error) {
    showError(error);
  }
}

function button(label, action, disabled = false) {
  const element = document.createElement("button");
  element.className = "mdo-button";
  element.type = "button";
  element.textContent = label;
  element.disabled = disabled;
  element.addEventListener("click", () => void act(action.type, action.details));
  return element;
}

function renderTimer() {
  if (!currentState?.settings?.pomodoro) return;
  const timer = getPomodoroState(currentState.settings.pomodoro, new Date());
  document.querySelector("#timer-countdown").textContent = formatDuration(timer.remainingMs);
  document.querySelector("#timer-phase").textContent = timer.state === "idle" ? "Ready to focus"
    : `${timer.phase === "focus" ? "Focus" : "Break"} · ${timer.state === "paused" ? "Paused" : "Running"}`;
}

function render(state) {
  currentState = state;
  const { settings, status } = state;
  const copy = statusText(state);
  document.querySelector("#status-badge").textContent = status.blocking ? "Focus is on" : "Ready";
  document.querySelector("#status-heading").textContent = copy.title;
  document.querySelector("#status-description").textContent = copy.description;
  document.querySelector("#site-count").textContent = String(status.blockedSites.length);
  document.querySelector("#next-change").textContent = formatClock(status.nextTransitionAt);

  const sessions = document.querySelector("#active-sessions");
  sessions.replaceChildren();
  if (!settings.sessions.length) {
    const empty = document.createElement("p");
    empty.className = "helper-text";
    empty.textContent = "No daily sessions yet.";
    sessions.append(empty);
  }
  settings.sessions.forEach((session, index) => {
    const schedule = status.sessionStates[index];
    const row = document.createElement("div");
    row.className = "compact-row";
    const label = document.createElement("span");
    label.textContent = `${session.name} · ${session.schedule.start}–${session.schedule.end}`;
    const stateLabel = document.createElement("small");
    stateLabel.textContent = schedule.paused ? "Paused" : schedule.active ? "Active" : "Waiting";
    row.append(label, stateLabel);
    if (session.mode === "normal") {
      row.append(button(schedule.paused ? "Resume" : "Pause",
        { type: "setSessionPaused", details: { id: session.id, paused: !schedule.paused } }));
    }
    sessions.append(row);
  });

  const timer = status.pomodoro;
  const locked = settings.pomodoro.mode === "hardcore" && timer.state === "running" && timer.phase === "focus";
  const actions = document.querySelector("#timer-actions");
  actions.replaceChildren();
  if (timer.state === "idle") {
    actions.append(button("Start focus", { type: "startPomodoro" }));
  } else {
    actions.append(button(timer.state === "paused" ? "Resume" : "Pause",
      { type: timer.state === "paused" ? "resumePomodoro" : "pausePomodoro" }, locked));
    actions.append(button("Stop", { type: "stopPomodoro" }, locked));
  }
  renderTimer();
  clearTimeout(refreshTimer);
  if (status.nextTransitionAt) {
    refreshTimer = setTimeout(() => {
      void sendAction("getState").then(render).catch(showError);
    }, Math.max(1000, status.nextTransitionAt - Date.now() + 150));
  }
}

document.querySelector("#open-options").addEventListener("click", () => void chrome.runtime.openOptionsPage());
setInterval(renderTimer, 1000);
void sendAction("getState").then(render).catch(showError);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void sendAction("getState").then(render).catch(showError);
});

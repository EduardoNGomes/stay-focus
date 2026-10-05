import { getPomodoroState } from "./pomodoro.js";
import { clearError, formatClock, formatDuration, sendAction, showError, statusText } from "./ui.js";

let currentState;
let refreshTimer;

async function act(type, details = {}, success = "Saved.") {
  clearError();
  document.querySelector("#feedback").textContent = "";
  try {
    render(await sendAction(type, details));
    document.querySelector("#feedback").textContent = success;
    return true;
  } catch (error) {
    showError(error);
    return false;
  }
}

function makeButton(label, action, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mdo-button";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", action);
  return button;
}

function renderSites(list, sites, remove, locked) {
  list.replaceChildren();
  if (!sites.length) {
    const empty = document.createElement("li");
    empty.className = "empty-list";
    empty.textContent = "No sites added yet.";
    list.append(empty);
  }
  for (const site of sites) {
    const row = document.createElement("li");
    row.className = "site-row";
    const label = document.createElement("span");
    label.textContent = site;
    const button = makeButton("×", () => void remove(site), locked);
    button.classList.add("mdo-button--icon");
    button.setAttribute("aria-label", `Remove ${site}`);
    row.append(label, button);
    list.append(row);
  }
}

function renderSessions(state) {
  const list = document.querySelector("#session-list");
  list.replaceChildren();
  if (!state.settings.sessions.length) {
    const empty = document.createElement("p");
    empty.className = "helper-text";
    empty.textContent = "No sessions yet. Create one above to set a daily block.";
    list.append(empty);
  }
  state.settings.sessions.forEach((session, index) => {
    const status = state.status.sessionStates[index];
    const locked = session.mode === "hardcore" && status.active;
    const card = document.createElement("section");
    card.className = "mdo-panel mdo-card session-card";
    card.innerHTML = `
      <div class="section-heading"><h3 class="mdo-card__title"></h3><span class="mdo-badge"></span></div>
      <p class="helper-text session-status"></p>
      <form class="form-stack session-settings">
        <label class="mdo-field"><span class="mdo-label">Name</span><input class="mdo-input" name="name" maxlength="60" required></label>
        <div class="time-fields">
          <label class="mdo-field"><span class="mdo-label">Start</span><input class="mdo-input" name="start" type="time" required></label>
          <label class="mdo-field"><span class="mdo-label">End</span><input class="mdo-input" name="end" type="time" required></label>
        </div>
        <label class="mdo-field"><span class="mdo-label">Mode</span><select class="mdo-input" name="mode"><option value="normal">Normal</option><option value="hardcore">Hardcore</option></select></label>
        <div class="button-row"><button class="mdo-button mdo-button--primary" type="submit">Save session</button><button class="mdo-button delete-session" type="button">Delete</button></div>
      </form>
      <form class="form-stack session-site-form">
        <label class="mdo-field"><span class="mdo-label">Website</span><input class="mdo-input" name="site" type="text" inputmode="url" autocomplete="off" placeholder="example.com" required></label>
        <button class="mdo-button mdo-button--primary" type="submit">Add site</button>
      </form>
      <ul class="site-list" aria-label="Session sites"></ul>
      <div class="session-actions"></div>`;
    card.querySelector("h3").textContent = session.name;
    card.querySelector(".mdo-badge").textContent = session.mode === "hardcore" ? "Hardcore" : "Normal";
    card.querySelector(".session-status").textContent = locked
      ? `Active · Controls unlock at ${formatClock(status.windowEndAt)}`
      : status.paused ? "Paused until this window ends"
        : status.active ? "Active now" : `Next start: ${formatClock(status.nextTransitionAt)}`;
    const form = card.querySelector(".session-settings");
    form.elements.name.value = session.name;
    form.elements.start.value = session.schedule.start;
    form.elements.end.value = session.schedule.end;
    form.elements.mode.value = session.mode;
    for (const control of form.elements) control.disabled = locked;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void act("updateSession", {
        id: session.id,
        name: form.elements.name.value,
        start: form.elements.start.value,
        end: form.elements.end.value,
        mode: form.elements.mode.value
      }, "Session saved.");
    });
    card.querySelector(".delete-session").addEventListener("click", () => {
      void act("deleteSession", { id: session.id }, "Session deleted.");
    });
    const siteForm = card.querySelector(".session-site-form");
    siteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (await act("addSessionSite", { id: session.id, value: siteForm.elements.site.value }, "Site added.")) {
        siteForm.elements.site.value = "";
      }
    });
    renderSites(card.querySelector(".site-list"), session.sites,
      (site) => act("removeSessionSite", { id: session.id, value: site }, "Site removed."), locked);
    if (session.mode === "normal") {
      card.querySelector(".session-actions").append(makeButton(status.paused ? "Resume session" : "Pause session",
        () => void act("setSessionPaused", { id: session.id, paused: !status.paused },
          status.paused ? "Session resumed." : "Session paused.")));
    }
    list.append(card);
  });
}

function renderTimer() {
  if (!currentState?.settings?.pomodoro) return;
  const timer = getPomodoroState(currentState.settings.pomodoro, new Date());
  document.querySelector("#timer-countdown").textContent = formatDuration(timer.remainingMs);
  document.querySelector("#timer-phase").textContent = timer.state === "idle" ? "Ready to focus"
    : `${timer.phase === "focus" ? "Focus" : "Break"} · ${timer.state === "paused" ? "Paused" : "Running"}`;
}

function renderPomodoro(state) {
  const { pomodoro } = state.settings;
  const timer = state.status.pomodoro;
  const locked = pomodoro.mode === "hardcore" && timer.state === "running" && timer.phase === "focus";
  const form = document.querySelector("#pomodoro-settings-form");
  form.elements.focusMinutes.value = pomodoro.focusMinutes;
  form.elements.breakMinutes.value = pomodoro.breakMinutes;
  form.elements.mode.value = pomodoro.mode;
  for (const control of form.elements) control.disabled = timer.state !== "idle";
  const actions = document.querySelector("#timer-actions");
  actions.replaceChildren();
  if (timer.state === "idle") {
    actions.append(makeButton("Start focus", () => void act("startPomodoro", {}, "Pomodoro started.")));
  } else {
    actions.append(makeButton(timer.state === "paused" ? "Resume" : "Pause",
      () => void act(timer.state === "paused" ? "resumePomodoro" : "pausePomodoro", {},
        timer.state === "paused" ? "Pomodoro resumed." : "Pomodoro paused."), locked));
    actions.append(makeButton("Stop", () => void act("stopPomodoro", {}, "Pomodoro stopped."), locked));
  }
  renderSites(document.querySelector("#pomodoro-sites"), pomodoro.sites,
    (site) => act("removePomodoroSite", { value: site }, "Site removed."), locked);
  renderTimer();
}

function render(state) {
  currentState = state;
  const copy = statusText(state);
  document.querySelector("#status-badge").textContent = copy.title;
  document.querySelector("#status-description").textContent = copy.description;
  renderSessions(state);
  renderPomodoro(state);
  clearTimeout(refreshTimer);
  if (state.status.nextTransitionAt) {
    refreshTimer = setTimeout(() => {
      void sendAction("getState").then(render).catch(showError);
    }, Math.max(1000, state.status.nextTransitionAt - Date.now() + 150));
  }
}

document.querySelector("#create-session-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (await act("createSession", {
    name: form.elements.name.value,
    start: form.elements.start.value,
    end: form.elements.end.value,
    mode: form.elements.mode.value
  }, "Session created.")) form.elements.name.value = "";
});
document.querySelector("#pomodoro-settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  void act("configurePomodoro", {
    focusMinutes: form.elements.focusMinutes.value,
    breakMinutes: form.elements.breakMinutes.value,
    mode: form.elements.mode.value
  }, "Timer saved.");
});
document.querySelector("#pomodoro-site-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (await act("addPomodoroSite", { value: form.elements.site.value }, "Site added.")) {
    form.elements.site.value = "";
  }
});
setInterval(renderTimer, 1000);
void sendAction("getState").then(render).catch(showError);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void sendAction("getState").then(render).catch(showError);
});

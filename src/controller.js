import { ensureSettings, loadSettings, saveSettings } from "./settings.js";
import { normalizeSiteInput } from "./sites.js";
import { getFocusState } from "./focus.js";
import { getScheduleState, validateSchedule } from "./schedule.js";
import { getPomodoroState, validatePomodoroMinutes } from "./pomodoro.js";
import { buildBlockRules, reconcileBlockRules } from "./rules.js";
import { moveBlockedTab, moveOpenBlockedTabs } from "./tab-blocking.js";

export const TRANSITION_ALARM = "focus-transition";
export const MAX_SITES = 1000;

function mode(value) {
  if (!["normal", "hardcore"].includes(value)) throw new Error("Choose Normal or Hardcore mode.");
  return value;
}

function sessionName(value) {
  const name = String(value ?? "").trim();
  if (!name || name.length > 60) throw new Error("Use a session name of 1 to 60 characters.");
  return name;
}

function addSite(sites, value, settings) {
  const site = normalizeSiteInput(value);
  if (sites.includes(site)) throw new Error("This site is already on this list.");
  const allSites = new Set([
    ...settings.sessions.flatMap((session) => session.sites),
    ...settings.pomodoro.sites,
    site
  ]);
  if (allSites.size > MAX_SITES) throw new Error(`All lists together can hold up to ${MAX_SITES} sites.`);
  sites.push(site);
}

export function createController(api, now = () => new Date()) {
  const storage = api.storage.local;
  let firstReconcile = true;

  async function reconcile() {
    await ensureSettings(storage);
    const settings = await loadSettings(storage);
    const current = now();
    let expired = false;
    for (const session of settings.sessions) {
      if (session.normalPauseUntil && session.normalPauseUntil <= current.getTime()) {
        session.normalPauseUntil = null;
        expired = true;
      }
    }
    if (expired) await saveSettings(settings, storage);
    const status = getFocusState(settings, current);
    const rulesChanged = await reconcileBlockRules(
      api.declarativeNetRequest,
      buildBlockRules(status.blockedSites, status.blocking)
    );
    if (status.nextTransitionAt) {
      await api.alarms.create(TRANSITION_ALARM, { when: status.nextTransitionAt });
    } else {
      await api.alarms.clear(TRANSITION_ALARM);
    }
    if (status.blocking && (rulesChanged || firstReconcile)) {
      try {
        await moveOpenBlockedTabs(api, status.blockedSites);
      } catch (error) {
        console.warn("Stay Focus could not check open tabs:", error);
      }
    }
    firstReconcile = false;
    return { settings, status };
  }

  async function enforceTab(tabId, url) {
    await ensureSettings(storage);
    const settings = await loadSettings(storage);
    const status = getFocusState(settings, now());
    return status.blocking ? moveBlockedTab(api, tabId, url, status.blockedSites) : false;
  }

  async function dispatch(request) {
    if (request?.type === "getState") return reconcile();
    await ensureSettings(storage);
    const settings = await loadSettings(storage);
    const current = now();
    const next = structuredClone(settings);
    const session = next.sessions.find((item) => item.id === request?.id);
    const sessionState = session ? getScheduleState(session.schedule, current) : null;
    const sessionLocked = session?.mode === "hardcore" && sessionState?.active;
    const pomodoroState = getPomodoroState(next.pomodoro, current);
    const pomodoroLocked = next.pomodoro.mode === "hardcore"
      && pomodoroState.state === "running" && pomodoroState.phase === "focus";

    switch (request?.type) {
      case "createSession": {
        if (next.sessions.length >= 50) throw new Error("You can create up to 50 sessions.");
        const schedule = { start: request.start, end: request.end };
        validateSchedule(schedule);
        next.sessions.push({
          id: crypto.randomUUID(),
          name: sessionName(request.name),
          schedule,
          mode: mode(request.mode),
          sites: [],
          normalPauseUntil: null
        });
        break;
      }
      case "updateSession": {
        if (!session) throw new Error("Session not found.");
        if (sessionLocked) throw new Error("This Hardcore session is locked during its active window.");
        const schedule = { start: request.start, end: request.end };
        validateSchedule(schedule);
        Object.assign(session, {
          name: sessionName(request.name),
          schedule,
          mode: mode(request.mode),
          normalPauseUntil: null
        });
        break;
      }
      case "deleteSession": {
        if (!session) throw new Error("Session not found.");
        if (sessionLocked) throw new Error("This Hardcore session is locked during its active window.");
        next.sessions = next.sessions.filter((item) => item.id !== session.id);
        break;
      }
      case "addSessionSite": {
        if (!session) throw new Error("Session not found.");
        addSite(session.sites, request.value, next);
        break;
      }
      case "removeSessionSite": {
        if (!session) throw new Error("Session not found.");
        if (sessionLocked) throw new Error("Sites cannot be removed during an active Hardcore session.");
        const site = normalizeSiteInput(request.value);
        session.sites = session.sites.filter((item) => item !== site);
        break;
      }
      case "setSessionPaused": {
        if (!session) throw new Error("Session not found.");
        if (session.mode !== "normal") throw new Error("Pausing is available only in Normal mode.");
        session.normalPauseUntil = request.paused ? sessionState.nextWindowEndAt : null;
        break;
      }
      case "configurePomodoro": {
        if (pomodoroState.state !== "idle") throw new Error("Stop the timer before changing its durations or mode.");
        Object.assign(next.pomodoro, validatePomodoroMinutes(request.focusMinutes, request.breakMinutes), {
          mode: mode(request.mode)
        });
        break;
      }
      case "addPomodoroSite": {
        addSite(next.pomodoro.sites, request.value, next);
        break;
      }
      case "removePomodoroSite": {
        if (pomodoroLocked) throw new Error("Pomodoro sites are locked during a Hardcore focus interval.");
        const site = normalizeSiteInput(request.value);
        next.pomodoro.sites = next.pomodoro.sites.filter((item) => item !== site);
        break;
      }
      case "startPomodoro": {
        if (pomodoroState.state !== "idle") throw new Error("The Pomodoro timer has already started.");
        next.pomodoro.state = "running";
        next.pomodoro.anchorAt = current.getTime();
        next.pomodoro.pausedElapsedMs = 0;
        break;
      }
      case "pausePomodoro": {
        if (pomodoroState.state !== "running") throw new Error("The Pomodoro timer is not running.");
        if (pomodoroLocked) throw new Error("Hardcore Pomodoro cannot pause during a focus interval.");
        next.pomodoro.state = "paused";
        next.pomodoro.pausedElapsedMs = Math.max(0, current.getTime() - next.pomodoro.anchorAt);
        break;
      }
      case "resumePomodoro": {
        if (pomodoroState.state !== "paused") throw new Error("The Pomodoro timer is not paused.");
        next.pomodoro.state = "running";
        next.pomodoro.anchorAt = current.getTime() - next.pomodoro.pausedElapsedMs;
        break;
      }
      case "stopPomodoro": {
        if (pomodoroLocked) throw new Error("Hardcore Pomodoro cannot stop during a focus interval.");
        next.pomodoro.state = "idle";
        next.pomodoro.anchorAt = null;
        next.pomodoro.pausedElapsedMs = 0;
        break;
      }
      default:
        throw new Error("Unknown action.");
    }

    await saveSettings(next, storage);
    try {
      return await reconcile();
    } catch (error) {
      await saveSettings(settings, storage);
      await reconcile();
      throw error;
    }
  }

  return { reconcile, dispatch, enforceTab };
}

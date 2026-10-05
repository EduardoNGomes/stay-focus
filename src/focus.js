import { getScheduleState } from "./schedule.js";
import { getPomodoroState } from "./pomodoro.js";

export function getFocusState(settings, now = new Date()) {
  const sessionStates = settings.sessions.map((session) => {
    const schedule = getScheduleState(session.schedule, now);
    const paused = session.mode === "normal" && Number(session.normalPauseUntil) > now.getTime();
    return {
      id: session.id,
      ...schedule,
      paused,
      blocking: schedule.active && !paused && session.sites.length > 0
    };
  });
  const pomodoro = getPomodoroState(settings.pomodoro, now);
  const blockedSites = new Set();
  settings.sessions.forEach((session, index) => {
    if (sessionStates[index].blocking) session.sites.forEach((site) => blockedSites.add(site));
  });
  if (pomodoro.blocking) settings.pomodoro.sites.forEach((site) => blockedSites.add(site));
  const transitions = [
    ...sessionStates.map((session) => session.nextTransitionAt),
    pomodoro.nextTransitionAt
  ].filter((at) => Number.isFinite(at));
  return {
    sessionStates,
    pomodoro,
    blockedSites: [...blockedSites].sort(),
    blocking: blockedSites.size > 0,
    nextTransitionAt: transitions.length ? Math.min(...transitions) : null
  };
}

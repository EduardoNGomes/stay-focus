export function validatePomodoroMinutes(focusMinutes, breakMinutes) {
  const focus = Number(focusMinutes);
  const rest = Number(breakMinutes);
  if (!Number.isInteger(focus) || focus < 1 || focus > 240 || !Number.isInteger(rest) || rest < 1 || rest > 240) {
    throw new Error("Focus and break must each be between 1 and 240 minutes.");
  }
  return { focusMinutes: focus, breakMinutes: rest };
}

export function getPomodoroState(pomodoro, now = new Date()) {
  const { focusMinutes, breakMinutes } = validatePomodoroMinutes(pomodoro.focusMinutes, pomodoro.breakMinutes);
  const focusMs = focusMinutes * 60_000;
  const breakMs = breakMinutes * 60_000;
  const cycleMs = focusMs + breakMs;
  const state = ["running", "paused"].includes(pomodoro.state) ? pomodoro.state : "idle";
  const elapsedMs = state === "running"
    ? Math.max(0, now.getTime() - Number(pomodoro.anchorAt))
    : state === "paused" ? Math.max(0, Number(pomodoro.pausedElapsedMs)) : 0;
  const position = elapsedMs % cycleMs;
  const phase = position < focusMs ? "focus" : "break";
  const remainingMs = phase === "focus" ? focusMs - position : cycleMs - position;
  return {
    state,
    phase,
    remainingMs,
    nextTransitionAt: state === "running" ? now.getTime() + remainingMs : null,
    blocking: state === "running" && phase === "focus" && pomodoro.sites.length > 0,
    completedFocusCount: Math.floor(elapsedMs / cycleMs) + (phase === "break" ? 1 : 0)
  };
}

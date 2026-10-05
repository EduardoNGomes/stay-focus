import test from "node:test";
import assert from "node:assert/strict";
import { getPomodoroState, validatePomodoroMinutes } from "../src/pomodoro.js";

const timer = {
  focusMinutes: 2, breakMinutes: 1, sites: ["example.com"],
  mode: "normal", state: "running", anchorAt: 1_000, pausedElapsedMs: 0
};

test("focus and break boundaries repeat from a saved anchor", () => {
  assert.equal(getPomodoroState(timer, new Date(1_000)).phase, "focus");
  assert.equal(getPomodoroState(timer, new Date(121_000)).phase, "break");
  assert.equal(getPomodoroState(timer, new Date(181_000)).phase, "focus");
  assert.equal(getPomodoroState(timer, new Date(181_000)).completedFocusCount, 1);
});

test("paused countdown stays frozen and does not block", () => {
  const paused = { ...timer, state: "paused", pausedElapsedMs: 60_000 };
  const state = getPomodoroState(paused, new Date(1_000_000));
  assert.equal(state.remainingMs, 60_000);
  assert.equal(state.blocking, false);
  assert.equal(state.nextTransitionAt, null);
});

test("timer durations must be whole minutes in range", () => {
  assert.deepEqual(validatePomodoroMinutes("25", "5"), { focusMinutes: 25, breakMinutes: 5 });
  assert.throws(() => validatePomodoroMinutes("1.5", 5));
  assert.throws(() => validatePomodoroMinutes(25, 0));
});

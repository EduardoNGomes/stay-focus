import test from "node:test";
import assert from "node:assert/strict";
import { getScheduleState, validateSchedule } from "../src/schedule.js";

const day = { start: "13:00", end: "18:00" };

test("daily window uses inclusive start and exclusive end", () => {
  assert.equal(getScheduleState(day, new Date(2026, 9, 5, 12, 59)).active, false);
  assert.equal(getScheduleState(day, new Date(2026, 9, 5, 13, 0)).active, true);
  assert.equal(getScheduleState(day, new Date(2026, 9, 5, 17, 59)).active, true);
  assert.equal(getScheduleState(day, new Date(2026, 9, 5, 18, 0)).active, false);
});

test("overnight window ends on the next calendar day", () => {
  const overnight = { start: "22:00", end: "02:00" };
  const evening = getScheduleState(overnight, new Date(2026, 9, 5, 23, 0));
  const morning = getScheduleState(overnight, new Date(2026, 9, 6, 1, 0));
  assert.equal(evening.active, true);
  assert.equal(new Date(evening.windowEndAt).getDate(), 6);
  assert.equal(morning.active, true);
  assert.equal(new Date(morning.windowEndAt).getHours(), 2);
  assert.equal(getScheduleState(overnight, new Date(2026, 9, 6, 2, 0)).active, false);
});

test("next transition and end are computed from local boundaries", () => {
  const before = getScheduleState(day, new Date(2026, 9, 5, 12, 0));
  assert.equal(new Date(before.nextTransitionAt).getHours(), 13);
  assert.equal(new Date(before.nextWindowEndAt).getHours(), 18);
  const during = getScheduleState(day, new Date(2026, 9, 5, 14, 0));
  assert.equal(during.nextTransitionAt, during.windowEndAt);
});

test("equal or invalid times are rejected", () => {
  assert.throws(() => validateSchedule({ start: "13:00", end: "13:00" }));
  assert.throws(() => validateSchedule({ start: "25:00", end: "18:00" }));
});

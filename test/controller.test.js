import test from "node:test";
import assert from "node:assert/strict";
import { createController, TRANSITION_ALARM } from "../src/controller.js";

function fakeChrome(initialSettings, openTabs = []) {
  let settings = initialSettings;
  let rules = [];
  const alarms = [];
  const tabs = structuredClone(openTabs);
  const tabUpdates = [];
  return {
    runtime: { getURL(path) { return `chrome-extension://test/${path}`; } },
    tabs: {
      async query() { return structuredClone(tabs); },
      async update(id, properties) {
        tabUpdates.push({ id, ...properties });
        const tab = tabs.find((item) => item.id === id);
        if (tab) tab.url = properties.url;
      },
      async reload() {}
    },
    storage: { local: {
      async get() { return settings === undefined ? {} : { settings: structuredClone(settings) }; },
      async set(value) { settings = structuredClone(value.settings); }
    } },
    declarativeNetRequest: {
      async getDynamicRules() { return structuredClone(rules); },
      async updateDynamicRules({ removeRuleIds, addRules }) {
        rules = rules.filter(({ id }) => !removeRuleIds.includes(id)).concat(structuredClone(addRules));
      }
    },
    alarms: {
      async create(name, info) { alarms.push({ name, ...info }); },
      async clear(name) { alarms.push({ cleared: name }); }
    },
    inspect() { return { settings, rules, alarms, tabs, tabUpdates }; }
  };
}

function sites(api) {
  return api.inspect().rules.map((rule) => rule.condition.urlFilter).sort();
}

async function createSession(controller, name, start, end, mode = "normal") {
  const result = await controller.dispatch({ type: "createSession", name, start, end, mode });
  return result.settings.sessions.at(-1).id;
}

test("a new setup has no blocks or transition alarm", async () => {
  const api = fakeChrome();
  const state = await createController(api, () => new Date(2026, 9, 5, 14)).reconcile();
  assert.deepEqual(state.settings.sessions, []);
  assert.deepEqual(sites(api), []);
  assert.equal(api.inspect().alarms.at(-1).cleared, TRANSITION_ALARM);
});

test("a partially stored version 2 setup receives Pomodoro defaults", async () => {
  const api = fakeChrome({ schemaVersion: 2, sessions: [] });
  const state = await createController(api, () => new Date(2026, 9, 5, 14)).reconcile();
  assert.equal(state.settings.pomodoro.focusMinutes, 25);
  assert.equal(state.status.pomodoro.state, "idle");
});

test("migrates the old setup into one session without losing its list or pause", async () => {
  const api = fakeChrome({
    sites: ["example.com"], schedule: { start: "13:00", end: "18:00" },
    mode: "hardcore", normalPauseUntil: null
  });
  const controller = createController(api, () => new Date(2026, 9, 5, 14));
  const { settings } = await controller.reconcile();
  assert.equal(settings.schemaVersion, 2);
  assert.deepEqual(settings.sessions[0].sites, ["example.com"]);
  assert.equal(settings.sessions[0].mode, "hardcore");
  assert.equal(settings.sessions[0].schedule.end, "18:00");
  assert.deepEqual(sites(api), ["||example.com^"]);
  assert.equal(api.inspect().settings.sessions[0].id, settings.sessions[0].id);
});

test("independent overlapping sessions use the union of active sites", async () => {
  const api = fakeChrome(undefined, [{ id: 1, url: "https://www.example.com/watch" }]);
  let clock = new Date(2026, 9, 5, 12);
  const controller = createController(api, () => clock);
  const morning = await createSession(controller, "Morning", "10:00", "14:00");
  const afternoon = await createSession(controller, "Afternoon", "13:00", "18:00");
  await controller.dispatch({ type: "addSessionSite", id: morning, value: "example.com" });
  await controller.dispatch({ type: "addSessionSite", id: afternoon, value: "example.com" });
  await controller.dispatch({ type: "addSessionSite", id: afternoon, value: "news.example" });
  assert.deepEqual(sites(api), ["||example.com^"]);
  clock = new Date(2026, 9, 5, 13);
  await controller.reconcile();
  assert.deepEqual(sites(api), ["||example.com^", "||news.example^"]);
  clock = new Date(2026, 9, 5, 14);
  await controller.reconcile();
  assert.deepEqual(sites(api), ["||example.com^", "||news.example^"]);
  clock = new Date(2026, 9, 5, 18);
  await controller.reconcile();
  assert.deepEqual(sites(api), []);
  assert.equal(api.inspect().alarms.at(-1).name, TRANSITION_ALARM);
  assert.equal(api.inspect().tabUpdates.length, 1);
});

test("Normal pause applies only to its session and expires at its end", async () => {
  const api = fakeChrome();
  let clock = new Date(2026, 9, 5, 14);
  const controller = createController(api, () => clock);
  const first = await createSession(controller, "One", "13:00", "18:00");
  const second = await createSession(controller, "Two", "13:00", "18:00");
  await controller.dispatch({ type: "addSessionSite", id: first, value: "a.example" });
  await controller.dispatch({ type: "addSessionSite", id: second, value: "b.example" });
  await controller.dispatch({ type: "setSessionPaused", id: first, paused: true });
  assert.deepEqual(sites(api), ["||b.example^"]);
  clock = new Date(2026, 9, 6, 14);
  await controller.reconcile();
  assert.deepEqual(sites(api), ["||a.example^", "||b.example^"]);
});

test("Hardcore locks only its active session", async () => {
  const api = fakeChrome();
  const controller = createController(api, () => new Date(2026, 9, 5, 14));
  const locked = await createSession(controller, "Locked", "13:00", "18:00", "hardcore");
  const other = await createSession(controller, "Other", "13:00", "18:00");
  await controller.dispatch({ type: "addSessionSite", id: locked, value: "example.com" });
  for (const action of [
    { type: "removeSessionSite", id: locked, value: "example.com" },
    { type: "updateSession", id: locked, name: "Changed", start: "14:00", end: "18:00", mode: "normal" },
    { type: "deleteSession", id: locked },
    { type: "setSessionPaused", id: locked, paused: true }
  ]) await assert.rejects(controller.dispatch(action));
  await controller.dispatch({ type: "addSessionSite", id: other, value: "another.example" });
  await controller.dispatch({ type: "deleteSession", id: other });
  assert.deepEqual(sites(api), ["||example.com^"]);
});

test("Pomodoro alternates focus and break, survives restart, and pauses", async () => {
  const api = fakeChrome();
  let clock = new Date(2026, 9, 5, 12);
  let controller = createController(api, () => clock);
  await controller.dispatch({ type: "configurePomodoro", focusMinutes: 2, breakMinutes: 1, mode: "normal" });
  await controller.dispatch({ type: "addPomodoroSite", value: "video.example" });
  await controller.dispatch({ type: "startPomodoro" });
  assert.deepEqual(sites(api), ["||video.example^"]);
  clock = new Date(2026, 9, 5, 12, 2);
  await controller.reconcile();
  assert.deepEqual(sites(api), []);
  controller = createController(api, () => clock);
  assert.equal((await controller.reconcile()).status.pomodoro.phase, "break");
  clock = new Date(2026, 9, 5, 12, 3);
  await controller.reconcile();
  assert.deepEqual(sites(api), ["||video.example^"]);
  await controller.dispatch({ type: "pausePomodoro" });
  assert.deepEqual(sites(api), []);
  clock = new Date(2026, 9, 5, 12, 8);
  assert.equal((await controller.reconcile()).status.pomodoro.phase, "focus");
  await controller.dispatch({ type: "resumePomodoro" });
  assert.deepEqual(sites(api), ["||video.example^"]);
  await controller.dispatch({ type: "stopPomodoro" });
  assert.deepEqual(sites(api), []);
});

test("Pomodoro and a session keep overlapping sites blocked through a break", async () => {
  const api = fakeChrome();
  let clock = new Date(2026, 9, 5, 12);
  const controller = createController(api, () => clock);
  const id = await createSession(controller, "Work", "12:00", "13:00");
  await controller.dispatch({ type: "addSessionSite", id, value: "video.example" });
  await controller.dispatch({ type: "addPomodoroSite", value: "video.example" });
  await controller.dispatch({ type: "configurePomodoro", focusMinutes: 1, breakMinutes: 1, mode: "normal" });
  await controller.dispatch({ type: "startPomodoro" });
  clock = new Date(2026, 9, 5, 12, 1);
  await controller.reconcile();
  assert.deepEqual(sites(api), ["||video.example^"]);
});

test("Hardcore Pomodoro locks pause, stop, and removal only during focus", async () => {
  const api = fakeChrome();
  let clock = new Date(2026, 9, 5, 12);
  const controller = createController(api, () => clock);
  await controller.dispatch({ type: "addPomodoroSite", value: "video.example" });
  await controller.dispatch({ type: "configurePomodoro", focusMinutes: 1, breakMinutes: 1, mode: "hardcore" });
  await controller.dispatch({ type: "startPomodoro" });
  for (const action of [
    { type: "pausePomodoro" }, { type: "stopPomodoro" },
    { type: "removePomodoroSite", value: "video.example" }
  ]) await assert.rejects(controller.dispatch(action));
  clock = new Date(2026, 9, 5, 12, 1);
  await controller.dispatch({ type: "stopPomodoro" });
  assert.deepEqual(sites(api), []);
});

test("activated blocked tabs move to focus page and failed rule updates roll back", async () => {
  const api = fakeChrome();
  const controller = createController(api, () => new Date(2026, 9, 5, 14));
  const id = await createSession(controller, "Work", "13:00", "18:00");
  await controller.dispatch({ type: "addSessionSite", id, value: "youtube.com" });
  assert.equal(await controller.enforceTab(7, "https://www.youtube.com/"), true);
  assert.equal(await controller.enforceTab(8, "https://notyoutube.com/"), false);
  assert.match(api.inspect().tabUpdates[0].url, /site=www.youtube.com/);
  const original = api.declarativeNetRequest.updateDynamicRules;
  let fail = true;
  api.declarativeNetRequest.updateDynamicRules = async (change) => {
    if (fail) { fail = false; throw new Error("rule update failed"); }
    await original(change);
  };
  await assert.rejects(controller.dispatch({ type: "addSessionSite", id, value: "other.example" }), /rule update failed/);
  assert.deepEqual(api.inspect().settings.sessions[0].sites, ["youtube.com"]);
});

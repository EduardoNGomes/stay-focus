import test from "node:test";
import assert from "node:assert/strict";
import { sendAction } from "../src/ui.js";

test("an out-of-date worker response gives an actionable error", async () => {
  const original = globalThis.chrome;
  globalThis.chrome = {
    runtime: {
      async sendMessage() {
        return {
          ok: true,
          state: {
            settings: { schemaVersion: 2, sessions: [] },
            status: { sessionStates: [], blockedSites: [], pomodoro: { state: "idle" } }
          }
        };
      }
    }
  };
  try {
    await assert.rejects(sendAction("getState"), /Reload it at chrome:\/\/extensions/);
  } finally {
    globalThis.chrome = original;
  }
});

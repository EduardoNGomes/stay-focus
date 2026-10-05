import test from "node:test";
import assert from "node:assert/strict";
import { blockedHostForUrl, blockedPageUrl } from "../src/tab-blocking.js";

test("matches a root domain and subdomains without matching unrelated hosts", () => {
  const sites = ["youtube.com"];
  assert.equal(blockedHostForUrl("https://youtube.com/", sites), "youtube.com");
  assert.equal(blockedHostForUrl("https://www.youtube.com/watch", sites), "www.youtube.com");
  assert.equal(blockedHostForUrl("https://notyoutube.com/", sites), null);
  assert.equal(blockedHostForUrl("https://youtube.com.evil.test/", sites), null);
  assert.equal(blockedHostForUrl("chrome://extensions", sites), null);
});

test("blocked page URL preserves the original site for an explicit retry", () => {
  const runtime = { getURL: (path) => `chrome-extension://test/${path}` };
  const target = new URL(blockedPageUrl(runtime, "https://www.youtube.com/watch?v=1", "www.youtube.com"));
  assert.equal(target.pathname, "/blocked.html");
  assert.equal(target.searchParams.get("site"), "www.youtube.com");
  assert.equal(target.searchParams.get("from"), "https://www.youtube.com/watch?v=1");
});

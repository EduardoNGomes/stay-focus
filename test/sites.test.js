import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSiteInput } from "../src/sites.js";

test("normalizes hostnames and HTTP URLs", () => {
  assert.equal(normalizeSiteInput(" Example.COM "), "example.com");
  assert.equal(normalizeSiteInput("https://WWW.Example.com/path?q=1"), "www.example.com");
  assert.equal(normalizeSiteInput("http://example.com:8080/"), "example.com");
  assert.equal(normalizeSiteInput("example.com:8080"), "example.com");
  assert.equal(normalizeSiteInput("https://bücher.de"), "xn--bcher-kva.de");
});

test("rejects invalid and unsupported site input", () => {
  for (const value of ["", "example .com", "ftp://example.com", "chrome://extensions", "https://user:pass@example.com", "*.example.com", "-bad.example"]) {
    assert.throws(() => normalizeSiteInput(value), value);
  }
});

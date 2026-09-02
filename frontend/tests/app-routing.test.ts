import assert from "node:assert/strict";
import test from "node:test";

import { resolveAppRoute } from "../src/app/routing.ts";

test("root and Jar paths resolve to the contribution-first view", () => {
  assert.equal(resolveAppRoute("/"), "jar");
  assert.equal(resolveAppRoute("/resilience-jar"), "jar");
  assert.equal(resolveAppRoute("/resilience-jar/"), "jar");
});

test("plan settings has a separate route", () => {
  assert.equal(resolveAppRoute("/resilience-jar/plan"), "plan");
  assert.equal(resolveAppRoute("/resilience-jar/plan/"), "plan");
});

test("scenario simulator has a separate route", () => {
  assert.equal(resolveAppRoute("/scenario-simulator"), "scenario");
  assert.equal(resolveAppRoute("/scenario-simulator/"), "scenario");
});

test("unknown paths remain explicit", () => {
  assert.equal(resolveAppRoute("/contributions"), "not_found");
});

import assert from "node:assert/strict";
import test from "node:test";

import { resolveAppRoute } from "../src/app/routing.ts";

test("root resolves to the home overview", () => {
  assert.equal(resolveAppRoute("/"), "home");
});

test("signin has its own route", () => {
  assert.equal(resolveAppRoute("/signin"), "signin");
  assert.equal(resolveAppRoute("/signin/"), "signin");
});

test("a signed-out visitor sees the landing page at the root route", () => {
  // The landing page is the public front door: App renders LandingPage for
  // the "home" route (and every unrecognised path) whenever there is no
  // signed-in user, so resolving "/" to "home" is what makes that possible.
  assert.equal(resolveAppRoute("/"), "home");
});

test("a signed-out visitor at /signin sees the auth form", () => {
  // App renders AuthPage specifically for the "signin" route when signed
  // out; every other path (including unknown ones) falls back to the
  // landing page instead of the bare sign-in form.
  assert.equal(resolveAppRoute("/signin"), "signin");
});

test("onboarding has its own route", () => {
  assert.equal(resolveAppRoute("/onboarding"), "onboarding");
  assert.equal(resolveAppRoute("/onboarding/"), "onboarding");
});

test("resilience jar has a separate route from home", () => {
  assert.equal(resolveAppRoute("/resilience-jar"), "jar");
  assert.equal(resolveAppRoute("/resilience-jar/"), "jar");
});

test("plan settings has a separate route", () => {
  assert.equal(resolveAppRoute("/resilience-jar/plan"), "plan");
  assert.equal(resolveAppRoute("/resilience-jar/plan/"), "plan");
});

test("savings has a separate route", () => {
  assert.equal(resolveAppRoute("/savings"), "savings");
  assert.equal(resolveAppRoute("/savings/"), "savings");
});

test("scenario simulator has a separate route", () => {
  assert.equal(resolveAppRoute("/scenario-simulator"), "scenario");
  assert.equal(resolveAppRoute("/scenario-simulator/"), "scenario");
});

test("scheme navigator has a separate route", () => {
  assert.equal(resolveAppRoute("/scheme-navigator"), "schemes");
  assert.equal(resolveAppRoute("/scheme-navigator/"), "schemes");
});

test("profile has a route, and settings redirects into it", () => {
  assert.equal(resolveAppRoute("/profile"), "profile");
  assert.equal(resolveAppRoute("/profile/"), "profile");
  assert.equal(resolveAppRoute("/settings"), "profile");
  assert.equal(resolveAppRoute("/settings/"), "profile");
});

test("unknown paths remain explicit", () => {
  assert.equal(resolveAppRoute("/contributions"), "not_found");
});

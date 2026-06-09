// Unit + fixture smoke tests for the minimal resident renderer.
//
// These prove three things the safe-rendering contract requires:
//   1. Every valid fixture renders to inert structured output in the renderer
//      state its kind declares.
//   2. Every invalid fixture fails closed: it never reaches a renderable state
//      and never leaks an unsafe value into the output.
//   3. Denied / pending-approval / display-only states never expose an
//      executable callback or execution capability.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

import {
  renderActionRef,
  renderFixture,
  renderUiPayload,
} from "../src/index.mjs";
import { scanUnsafePayload } from "../src/safe-payload.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, "..", "fixtures", "compatibility");

function readFixtures(group) {
  const dir = join(fixturesRoot, group);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({ name, fixture: JSON.parse(readFileSync(join(dir, name), "utf8")) }));
}

// A render result is inert when it survives a JSON round-trip unchanged, which
// is only possible if it holds no functions, symbols, or other non-serializable
// (i.e. potentially executable) values.
function assertInert(node, label) {
  assert.deepEqual(JSON.parse(JSON.stringify(node)), node, `${label}: render output must be JSON-inert`);
}

function collectFunctions(value, out = []) {
  if (typeof value === "function") out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectFunctions(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) collectFunctions(item, out);
  return out;
}

// No node anywhere may advertise the ability to execute. We reject both a
// callback shape and any truthy `executable`/`canExecute` capability flag.
function collectExecutable(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectExecutable(item, out);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if ((key === "executable" || key === "canExecute") && item === true) out.push(key);
      collectExecutable(item, out);
    }
  }
  return out;
}

function assertNoExecutable(node, label) {
  assert.equal(collectFunctions(node).length, 0, `${label}: render output must contain no callbacks`);
  assert.deepEqual(collectExecutable(node), [], `${label}: render output must expose no executable capability`);
}

function assertNoUnsafe(node, label) {
  assert.deepEqual(scanUnsafePayload(node), [], `${label}: render output must contain no unsafe values`);
}

const validFixtures = readFixtures("valid");
const invalidFixtures = readFixtures("invalid");

test("the fixture corpus is present", () => {
  assert.ok(validFixtures.length >= 8, "expected the valid fixture set");
  assert.ok(invalidFixtures.length >= 10, "expected the invalid fixture set");
});

for (const { name, fixture } of validFixtures) {
  test(`valid fixture ${name} renders to its declared state, inert`, () => {
    const result = renderFixture(fixture);
    assert.equal(
      result.state,
      fixture.expectedRendererState,
      `renderer state must match expectedRendererState for ${name}`,
    );
    assertInert(result.node, name);
    assertNoExecutable(result.node, name);
    assertNoUnsafe(result.node, name);
  });
}

for (const { name, fixture } of invalidFixtures) {
  test(`invalid fixture ${name} fails closed`, () => {
    const result = renderFixture(fixture);
    // Fails closed: it never renders, and the resident renderer still computes
    // the terminal state its kind declares (invalid payloads -> invalid,
    // denied actions -> denied) rather than silently upgrading it.
    assert.notEqual(result.state, "renderable", `${name} must not reach a renderable state`);
    assert.equal(result.state, fixture.expectedRendererState, `${name} state mismatch`);
    assertInert(result.node, name);
    assertNoExecutable(result.node, name);
    assertNoUnsafe(result.node, name);
  });
}

test("a valid button payload renders the resident component with non-executable actions", () => {
  const result = renderUiPayload({
    schemaVersion: "2026-06-09",
    payloadId: "uip_demo_button",
    componentRef: { namespace: "@jami-studio/ui", name: "button", version: "0.0.0" },
    props: { variant: "primary" },
    children: ["Save"],
    actionRefs: ["act_save_theme"],
    fallback: { mode: "text", message: "Save is available." },
  });

  assert.equal(result.state, "renderable");
  assert.equal(result.node.component, "button");
  assert.deepEqual(result.node.props, { variant: "primary" });
  assert.deepEqual(result.node.children, [{ type: "text", value: "Save" }]);
  assert.deepEqual(result.node.actions, [{ actionId: "act_save_theme", executable: false }]);
});

test("event-handler props fail closed and never reach the node", () => {
  const result = renderUiPayload({
    schemaVersion: "2026-06-09",
    payloadId: "uip_evt",
    componentRef: { namespace: "@jami-studio/ui", name: "button", version: "0.0.0" },
    props: { label: "Run", onClick: "doDelete()" },
    fallback: { mode: "invalid_payload", message: "rejected" },
  });

  assert.equal(result.state, "invalid");
  assert.equal(JSON.stringify(result.node).includes("onClick"), false);
  assertNoUnsafe(result.node, "event-handler");
});

test("javascript: URLs and inline secrets fail closed", () => {
  const jsUrl = renderUiPayload({
    schemaVersion: "2026-06-09",
    payloadId: "uip_js",
    componentRef: { namespace: "@jami-studio/ui", name: "button", version: "0.0.0" },
    props: { href: "javascript:fetch('/steal')" },
    fallback: { mode: "invalid_payload", message: "rejected" },
  });
  assert.equal(jsUrl.state, "invalid");

  const secret = renderUiPayload({
    schemaVersion: "2026-06-09",
    payloadId: "uip_secret",
    componentRef: { namespace: "@jami-studio/ui", name: "artifact-card", version: "0.0.0" },
    props: { authorization: "inline-credential" },
    fallback: { mode: "invalid_payload", message: "rejected" },
  });
  assert.equal(secret.state, "invalid");
});

test("unsupported components degrade to an unsupported state, not invalid", () => {
  const result = renderUiPayload({
    schemaVersion: "2026-06-09",
    payloadId: "uip_chart",
    componentRef: { namespace: "@jami-studio/ui", name: "unknown-chart", version: "0.0.0" },
    props: { title: "chart" },
    fallback: { mode: "unsupported_component", message: "not supported" },
  });

  assert.equal(result.state, "unsupported");
  assert.equal(result.node.component, "inline-notice");
});

test("a denied action drops any forged execution capability", () => {
  const result = renderActionRef({
    schemaVersion: "2026-06-09",
    actionId: "act_delete_artifact",
    label: "Delete artifact",
    route: "harness://actions/delete-artifact",
    risk: "destructive",
    policyScope: "artifact.lifecycle",
    confirmationMode: "approval_required",
    state: "denied",
    denial: { reason: "missing_approval", auditRef: "aud_denied" },
    execution: { canExecute: true },
  });

  assert.equal(result.state, "denied");
  assert.equal(result.node.action.executable, false);
  assert.equal(result.node.denial.auditRef, "aud_denied");
  assertNoExecutable(result.node, "denied-action");
  // The forged execution block must not survive into the rendered output.
  assert.equal(JSON.stringify(result.node).includes("canExecute"), false);
});

test("a pending-approval action stays display-only and non-executable", () => {
  const result = renderActionRef({
    schemaVersion: "2026-06-09",
    actionId: "act_publish_release",
    label: "Publish release",
    route: "harness://actions/publish-release",
    risk: "external",
    policyScope: "release.publish",
    confirmationMode: "approval_required",
    state: "pending_approval",
  });

  assert.equal(result.state, "display-only");
  assert.equal(result.node.action.executable, false);
  assert.equal(result.node.denial, null);
  assertNoExecutable(result.node, "pending-approval");
});

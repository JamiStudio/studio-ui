// Tests for the workbench presentation seam.
//
// These prove the seam's safety and ownership contract:
//   1. Every presentation fixture resolves to the operational status its panel
//      declares (empty/loading/denied/redacted/stale/missing-source/unsupported/
//      error/ready).
//   2. Every descriptor is inert (JSON round-trips), carries no callback, and
//      exposes no executable capability — display-only, never execution.
//   3. The seam never leaks a secret value and never echoes unsafe free text.
//   4. The seam only consumes shared harness refs: presented identifiers are
//      echoed from the source ref, never fabricated, the memoryRecord and
//      contextPack contracts are mirrored (not invented), and any ref whose
//      source identifiers do not validate fails closed to missing-source.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";

import {
  presentArtifactView,
  presentEvidencePacket,
  presentMemoryContext,
  presentTrace,
  presentWorkbenchPanel,
} from "../src/index.mjs";
import { scanUnsafePayload } from "../src/safe-payload.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, "..", "fixtures", "presentation");

function readFixtures() {
  return readdirSync(fixturesRoot)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({ name, fixture: JSON.parse(readFileSync(join(fixturesRoot, name), "utf8")) }));
}

function assertInert(node, label) {
  assert.deepEqual(JSON.parse(JSON.stringify(node)), node, `${label}: descriptor must be JSON-inert`);
}

function collectFunctions(value, out = []) {
  if (typeof value === "function") out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectFunctions(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) collectFunctions(item, out);
  return out;
}

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

function assertSafeDisplayOnly(node, label) {
  assert.equal(collectFunctions(node).length, 0, `${label}: descriptor must contain no callbacks`);
  assert.deepEqual(collectExecutable(node), [], `${label}: descriptor must expose no executable capability`);
  assert.deepEqual(scanUnsafePayload(node), [], `${label}: descriptor must contain no unsafe values`);
}

const fixtures = readFixtures();

test("the presentation fixture corpus is present", () => {
  assert.ok(fixtures.length >= 11, "expected the presentation fixture set");
});

for (const { name, fixture } of fixtures) {
  test(`presentation fixture ${name} resolves to its declared status, inert`, () => {
    const result = presentWorkbenchPanel(fixture);
    assert.equal(
      result.status,
      fixture.expectedPresentationStatus,
      `status must match expectedPresentationStatus for ${name}`,
    );
    assert.equal(result.descriptor.status, result.status, `${name}: descriptor.status must mirror status`);
    assertInert(result.descriptor, name);
    assertSafeDisplayOnly(result.descriptor, name);
  });
}

test("artifact identifiers are echoed from the source ref, never fabricated", () => {
  const ref = {
    schemaVersion: "2026-06-09",
    artifactViewId: "artv_run_trace",
    artifactId: "art_run_trace_001",
    kind: "trace",
    title: "Run trace",
    promotionState: "accepted",
    renderers: [
      { rendererId: "studio-ui.artifact-card", mode: "studio_ui", componentRef: "@jami-studio/ui/artifact-card" },
    ],
    provenance: { runId: "run_x", sourceCommit: "abc", evidenceRef: "ev_x" },
  };
  const result = presentArtifactView(ref);
  assert.equal(result.status, "ready");
  assert.equal(result.descriptor.body.artifactViewId, ref.artifactViewId);
  assert.equal(result.descriptor.body.artifactId, ref.artifactId);
  assert.equal(result.descriptor.body.artifactKind, "trace");
  assert.equal(result.descriptor.body.provenance.runId, ref.provenance.runId);
});

test("a redacted evidence packet never echoes secret values and reports redacted", () => {
  const result = presentEvidencePacket({
    schemaVersion: "2026-06-09",
    evidenceId: "ev_secret",
    subject: "redacted run",
    freshnessClass: "current_run",
    source: { repo: "jami-harness", commit: "abc", recordedAt: "2026-06-09T00:00:00.000Z" },
    commands: [{ command: "deploy", status: "passed", recordedAt: "2026-06-09T00:00:00.000Z", authorization: "Bearer super-secret-token" }],
    redaction: { containsSecrets: true, privatePayloadPolicy: "redacted" },
    acceptedContracts: ["evidencePacket"],
  });
  assert.equal(result.status, "redacted");
  assert.equal(JSON.stringify(result.descriptor).includes("super-secret-token"), false);
  assert.equal(result.descriptor.body.redaction.containsSecrets, true);
});

test("stale freshness outranks an empty command list", () => {
  const result = presentEvidencePacket({
    schemaVersion: "2026-06-09",
    evidenceId: "ev_stale",
    subject: "stale",
    freshnessClass: "stale",
    source: { repo: "r", commit: "c", recordedAt: "2026-01-01T00:00:00.000Z" },
    commands: [],
    redaction: { containsSecrets: false, privatePayloadPolicy: "none" },
    acceptedContracts: ["evidencePacket"],
  });
  assert.equal(result.status, "stale");
  assert.ok(result.descriptor.flags.includes("stale"));
});

test("a trace with mismatched runIds fails closed to missing-source", () => {
  const result = presentTrace({
    runId: "run_a",
    events: [
      { eventId: "evt_1", runId: "run_a", sequence: 0, eventType: "run.started" },
      { eventId: "evt_2", runId: "run_b", sequence: 1, eventType: "run.completed" },
    ],
  });
  assert.equal(result.status, "missing-source");
});

test("a valid memory record presents ready and echoes its id, never fabricated", () => {
  const result = presentMemoryContext({
    schemaVersion: "2026-06-09",
    memoryId: "mem_note",
    kind: "project",
    summary: "a note",
    content: "body text",
    scope: { projectId: "proj_x", allowedActorIds: ["actor_dev"], allowedScopes: ["memory:read"] },
    source: { runId: "run_x", recordedAt: "2026-06-09T00:00:00.000Z" },
    freshness: { class: "current_run", asOf: "2026-06-09T00:00:00.000Z" },
    retention: { policy: "project", forgetAfter: "2026-07-09T00:00:00.000Z" },
    redaction: { classification: "internal", mode: "none", redactedFields: [] },
    citation: { citationId: "cit_note", label: "note", freshnessClass: "current_run" },
  });
  assert.equal(result.status, "ready");
  assert.equal(result.descriptor.body.subkind, "memoryRecord");
  assert.equal(result.descriptor.body.memoryId, "mem_note");
  assert.equal(result.descriptor.body.content, "body text");
});

test("a redacted memory record reports redacted and never echoes gated content", () => {
  const result = presentMemoryContext({
    schemaVersion: "2026-06-09",
    memoryId: "mem_secret",
    kind: "tool_output",
    summary: "credentials note",
    content: "do-not-leak-token-value",
    scope: { projectId: "proj_x", allowedActorIds: ["actor_dev"], allowedScopes: ["memory:read"] },
    source: { runId: "run_x", recordedAt: "2026-06-09T00:00:00.000Z" },
    freshness: { class: "current_run", asOf: "2026-06-09T00:00:00.000Z" },
    retention: { policy: "session", forgetAfter: "2026-06-10T00:00:00.000Z" },
    redaction: { classification: "secret_adjacent", mode: "redacted", redactedFields: ["content"] },
    citation: { citationId: "cit_secret", label: "secret", freshnessClass: "current_run" },
  });
  assert.equal(result.status, "redacted");
  assert.equal(result.descriptor.body.content, null);
  assert.equal(JSON.stringify(result.descriptor).includes("do-not-leak-token-value"), false);
});

test("a context pack with no items reports empty and echoes drop reasons", () => {
  const result = presentMemoryContext({
    schemaVersion: "2026-06-09",
    contextPackId: "ctx_x",
    runId: "run_x",
    assembledAt: "2026-06-09T00:00:00.000Z",
    deterministicHash: "sha256:x",
    items: [],
    droppedItems: [{ sourceRef: "mem_y", reason: "token_budget" }],
  });
  assert.equal(result.status, "empty");
  assert.equal(result.descriptor.body.subkind, "contextPack");
  assert.equal(result.descriptor.body.droppedItems[0].reason, "token_budget");
});

test("a memory ref whose identifiers do not validate fails closed to missing-source", () => {
  const result = presentMemoryContext({ memoryId: "not_valid", citation: { label: "x" } });
  assert.equal(result.status, "missing-source");
});

test("an HTML-like title from a harness ref is dropped, not echoed", () => {
  const result = presentArtifactView({
    schemaVersion: "2026-06-09",
    artifactViewId: "artv_x",
    artifactId: "art_x",
    kind: "report",
    title: "<img src=x onerror=alert(1)>",
    promotionState: "draft",
    renderers: [{ rendererId: "plain-text", mode: "text" }],
    provenance: { runId: "run_x", sourceCommit: "abc", evidenceRef: "ev_x" },
  });
  assert.equal(result.descriptor.body.title, null);
  assert.equal(JSON.stringify(result.descriptor).includes("onerror"), false);
});

test("loading lifecycle short-circuits before any ref is read", () => {
  const result = presentWorkbenchPanel({ kind: "evidencePacket", lifecycle: "loading", ref: null });
  assert.equal(result.status, "loading");
});

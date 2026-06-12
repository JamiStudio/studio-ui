// Deterministic temp-project smoke tests for the Studio UI CLI lifecycle.
//
// Each test installs into a fresh directory under the OS temp dir and drives the
// public `run` entry point, asserting real on-disk effects: written files,
// lockfile provenance, hash-based conflict detection, update/migrate planning,
// pinning, and provenance verification. The registry source is the repo's real
// generated registry (the CLI's default), so these exercise the actual install
// path, not a mock.

import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { run } from "../src/index.mjs";

let dir;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "studio-ui-cli-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function call(...argv) {
  return run(argv, { cwd: dir });
}

function readJson(rel) {
  return JSON.parse(readFileSync(join(dir, rel), "utf8"));
}

test("init writes an inspectable config", () => {
  const r = call("init", "--title", "Temp App", "--suite", "solo");
  assert.equal(r.code, 0);
  const config = readJson("studio-ui.config.json");
  assert.equal(config.appTitle, "Temp App");
  assert.equal(config.suite, "solo");
  assert.ok(config.registry, "config records the registry source");
});

test("init refuses to overwrite without --force", () => {
  call("init");
  const second = call("init");
  assert.equal(second.code, 1);
  assert.equal(second.result.status, "exists");
  assert.equal(call("init", "--force").code, 0);
});

test("list returns the real generated registry items", () => {
  const r = call("list");
  assert.equal(r.code, 0);
  const names = r.result.data.items.map((i) => i.name);
  assert.equal(names.length, 45);
  for (const name of [
    "agent-panel",
    "business-ops-app",
    "business-ops-dashboard-page",
    "business-ops-kpis-block",
    "button",
    "command-grid-brand",
    "editorial-studio-brand",
    "jami-theme",
    "mixed-media-library-page",
    "research-writing-sources-block",
    "solo-app",
    "solo-suite",
    "solo-today-page",
    "solo-agenda-block",
    "studio-console-brand",
  ]) {
    assert.ok(names.includes(name), `${name} listed`);
  }
});

test("add installs real theme files and records provenance in the lock", () => {
  call("init");
  const r = call("add", "jami-theme");
  assert.equal(r.code, 0);
  assert.equal(r.result.status, "installed");

  for (const f of ["jami.css", "jami.tailwind.css", "jami-tokens.ts", "jami.shadcn.json", "jami-token-provenance.json"]) {
    assert.ok(existsSync(join(dir, "studio-ui", f)), `${f} installed`);
  }
  const tokenProvenance = readJson(join("studio-ui", "jami-token-provenance.json"));
  assert.equal(tokenProvenance.hostedRegistryClaimed, false);
  assert.equal(tokenProvenance.packagePublishClaimed, false);
  assert.equal(tokenProvenance.outputs.length, 4);

  const lock = readJson("studio-ui.lock.json");
  const entry = lock.items.find((i) => i.name === "jami-theme");
  assert.equal(entry.sourceState, "installable");
  assert.equal(entry.files.length, 5);
  assert.ok(entry.sourceHash.startsWith("sha256:"));
  assert.ok(entry.files.every((f) => f.hash.startsWith("sha256:")));
  assert.equal(entry.provenance.license, "MIT");
  // config reflects the installed theme
  assert.equal(readJson("studio-ui.config.json").theme, "jami-theme");
});

test("add installs selectable brand option descriptors with no final-canon claim", () => {
  call("init");
  const r = call("add", "studio-console-brand");
  assert.equal(r.code, 0);
  assert.ok(r.result.data.graph.includes("jami-theme"), "brand option includes the factory theme dependency");
  assert.ok(existsSync(join(dir, "studio-ui", "branding", "studio-console.brand-option.json")));

  const descriptor = readJson(join("studio-ui", "branding", "studio-console.brand-option.json"));
  assert.equal(descriptor.canonicalBrand, false);
  assert.equal(descriptor.provenance.copiedSource, false);
  assert.ok(descriptor.seedMaterial.usage.includes("Exploratory"));
  assert.equal(descriptor.workbenchControls.radius, "6");

  const provenance = call("provenance", "studio-console-brand");
  assert.equal(provenance.code, 0);
  assert.equal(provenance.result.data.provenance.source, "authored");
  assert.ok(provenance.result.data.files.every((f) => f.state === "verified"));
});

test("dry-run plans without writing", () => {
  call("init");
  const r = call("add", "jami-theme", "--dry-run");
  assert.equal(r.code, 0);
  assert.equal(r.result.status, "planned");
  assert.ok(!existsSync(join(dir, "studio-ui", "jami.css")), "no files written on dry run");
  assert.ok(!existsSync(join(dir, "studio-ui.lock.json")), "no lock written on dry run");
});

test("add resolves a suite graph and installs authored primitive source", () => {
  call("init");
  const r = call("add", "solo-suite");
  assert.equal(r.code, 0);
  for (const name of [
    "jami-theme",
    "button",
    "panel",
    "text-field",
    "data-list",
    "agent-panel",
    "docs-source-panel",
    "solo-app",
    "solo-today-page",
    "solo-agenda-block",
    "solo-suite",
  ]) {
    assert.ok(r.result.data.graph.includes(name), `${name} included in suite graph`);
  }

  const lock = readJson("studio-ui.lock.json");
  const button = lock.items.find((i) => i.name === "button");
  assert.equal(button.sourceState, "installable");
  assert.ok(button.files.length > 0, "authored primitive files are installable");
  assert.equal(lock.items.find((i) => i.name === "solo-today-page").sourceState, "installable");
  assert.equal(lock.items.find((i) => i.name === "solo-agenda-block").sourceState, "installable");
  assert.equal(lock.items.find((i) => i.name === "solo-app").sourceState, "installable");
  // the suite manifest and theme files are real
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo.suite.json")));
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo", "solo-app.implementation.json")));
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo", "pages", "solo-today-page.page.json")));
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo", "pages", "solo-today-page.page.implementation.json")));
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo", "blocks", "solo-agenda-block.block.json")));
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo", "blocks", "solo-agenda-block.block.implementation.json")));
  assert.ok(existsSync(join(dir, "studio-ui", "jami.css")));
});

test("standalone suite pages and blocks install independently with provenance", () => {
  call("init");
  const page = call("add", "solo-today-page");
  assert.equal(page.code, 0);
  assert.ok(page.result.data.graph.includes("solo-agenda-block"), "page graph installs dependent blocks");
  assert.ok(page.result.data.graph.includes("data-list"), "page graph installs resident components");
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo", "pages", "solo-today-page.page.json")));
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo", "pages", "solo-today-page.page.implementation.json")));
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo", "blocks", "solo-agenda-block.block.json")));
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "solo", "blocks", "solo-agenda-block.block.implementation.json")));

  const pageManifest = readJson(join("studio-ui", "suites", "solo", "pages", "solo-today-page.page.json"));
  assert.equal(pageManifest.$schema, "https://jami.studio/schemas/registry/suite-page.generated.json");
  assert.equal(pageManifest.lane, "solo");
  assert.ok(pageManifest.routes.some((route) => route.path === "/solo/today"));
  assert.ok(pageManifest.components.includes("agent-panel"));
  const pageImplementation = readJson(join("studio-ui", "suites", "solo", "pages", "solo-today-page.page.implementation.json"));
  assert.equal(pageImplementation.$schema, "https://jami.studio/schemas/registry/suite-page-implementation.generated.json");
  assert.equal(pageImplementation.runtime.runtimeReactRenderer, false);
  assert.equal(pageImplementation.evidence.displayOnly, true);

  const block = call("add", "mixed-media-assets-block");
  assert.equal(block.code, 0);
  assert.ok(existsSync(join(dir, "studio-ui", "suites", "mixed-media", "blocks", "mixed-media-assets-block.block.json")));
  assert.ok(
    existsSync(join(dir, "studio-ui", "suites", "mixed-media", "blocks", "mixed-media-assets-block.block.implementation.json")),
  );
  const blockManifest = readJson(
    join("studio-ui", "suites", "mixed-media", "blocks", "mixed-media-assets-block.block.json"),
  );
  assert.equal(blockManifest.$schema, "https://jami.studio/schemas/registry/suite-block.generated.json");
  assert.equal(blockManifest.component, "media-grid");
  const blockImplementation = readJson(
    join("studio-ui", "suites", "mixed-media", "blocks", "mixed-media-assets-block.block.implementation.json"),
  );
  assert.equal(blockImplementation.$schema, "https://jami.studio/schemas/registry/suite-block-implementation.generated.json");
  assert.equal(blockImplementation.renderedStates.ready.rendererState, "renderable");
  assert.equal(blockImplementation.runtime.hostedRuntime, false);

  const provenance = call("provenance", "solo-today-page");
  assert.equal(provenance.code, 0);
  assert.equal(provenance.result.data.provenance.source, "registry/suites/solo/suite-shell.json");
  assert.ok(provenance.result.data.files.every((f) => f.state === "verified"));
});

test("each suite installs generated app-shell descriptors with route metadata", () => {
  const suites = ["solo", "business-ops", "mixed-media", "research-writing"];
  for (const suite of suites) {
    rmSync(dir, { recursive: true, force: true });
    dir = mkdtempSync(join(tmpdir(), "studio-ui-cli-"));
    call("init", "--suite", suite);
    const r = call("add", `${suite}-suite`);
    assert.equal(r.code, 0, `${suite} install succeeds`);
    assert.ok(r.result.data.graph.includes(`${suite}-suite`), `${suite} graph includes suite root`);

    const manifest = readJson(join("studio-ui", "suites", `${suite}.suite.json`));
    assert.equal(manifest.lane, suite);
    assert.ok(manifest.installGraph.dependencies.length >= 10, `${suite} install graph records vocabulary and page/block deps`);
    assert.ok(manifest.items.some((name) => name.endsWith("-page")), `${suite} page items generated`);
    assert.ok(manifest.items.some((name) => name.endsWith("-block")), `${suite} block items generated`);
    assert.ok(manifest.shell.appShell.id.startsWith(`app.${suite}.`), `${suite} app shell id`);
    assert.ok(manifest.shell.routes.length >= 2, `${suite} routes generated`);
    assert.ok(manifest.shell.pages.length >= 2, `${suite} pages generated`);
    assert.ok(manifest.shell.blocks.length >= 4, `${suite} blocks generated`);
    assert.ok(manifest.shell.componentParts.length >= 3, `${suite} component parts generated`);
    assert.ok(manifest.implementation.app.endsWith(`${suite}-app.implementation.json`), `${suite} app implementation ref`);
    assert.equal(manifest.implementation.runtimeReactApp, false, `${suite} manifest does not claim React runtime`);
    assert.ok(existsSync(join(dir, "studio-ui", "suites", suite, `${suite}-app.implementation.json`)), `${suite} app implementation installed`);
    const appImplementation = readJson(join("studio-ui", "suites", suite, `${suite}-app.implementation.json`));
    assert.equal(appImplementation.$schema, "https://jami.studio/schemas/registry/suite-app-implementation.generated.json");
    assert.equal(appImplementation.runtime.harnessRuntimeExecution, false, `${suite} no harness runtime claim`);
    assert.ok(appImplementation.evidence.renderedBlockCount >= 4, `${suite} app implementation records blocks`);
    assert.ok(manifest.shell.stateFixtures.longContent, `${suite} long-content fixture`);
    assert.ok(manifest.shell.stateFixtures.empty, `${suite} empty fixture`);
    assert.ok(manifest.shell.stateFixtures.error, `${suite} error fixture`);
  }
});

test("conflict: a locally modified file blocks overwrite until --force", () => {
  call("init");
  call("add", "jami-theme");
  appendFileSync(join(dir, "studio-ui", "jami.css"), "\n/* local edit */\n");

  const blocked = call("add", "jami-theme");
  assert.equal(blocked.code, 1);
  assert.equal(blocked.result.status, "conflict");
  // file is untouched
  assert.ok(readFileSync(join(dir, "studio-ui", "jami.css"), "utf8").includes("local edit"));

  const forced = call("add", "jami-theme", "--force");
  assert.equal(forced.code, 0);
  assert.ok(!readFileSync(join(dir, "studio-ui", "jami.css"), "utf8").includes("local edit"));
});

test("doctor reports drift and clears after restore", () => {
  call("init");
  call("add", "jami-theme");
  assert.equal(call("doctor").code, 0);

  appendFileSync(join(dir, "studio-ui", "jami.css"), "/* drift */");
  const drifted = call("doctor");
  assert.equal(drifted.code, 1);
  assert.ok(drifted.result.notes.some((n) => n.code === "file" && n.level === "drift"));

  call("add", "jami-theme", "--force");
  assert.equal(call("doctor").code, 0);
});

test("remove refuses modified files, then deletes and clears the lock", () => {
  call("init");
  call("add", "jami-theme");
  appendFileSync(join(dir, "studio-ui", "jami.css"), "/* edit */");
  assert.equal(call("remove", "jami-theme").code, 1);

  const forced = call("remove", "jami-theme", "--force");
  assert.equal(forced.code, 0);
  assert.ok(!existsSync(join(dir, "studio-ui", "jami.css")));
  assert.equal(readJson("studio-ui.lock.json").items.length, 0);
});

test("update detects outdated lock entries and reinstalls", () => {
  call("init");
  call("add", "jami-theme");
  // simulate an older installed version
  const lock = readJson("studio-ui.lock.json");
  lock.items.find((i) => i.name === "jami-theme").version = "0.0.0-old";
  writeFileSync(join(dir, "studio-ui.lock.json"), `${JSON.stringify(lock, null, 2)}\n`);

  const planned = call("update", "--dry-run");
  assert.equal(planned.result.status, "planned");
  assert.deepEqual(planned.result.data.plannedUpdates, ["jami-theme"]);

  const applied = call("update");
  assert.equal(applied.code, 0);
  assert.equal(applied.result.status, "updated");
  assert.equal(readJson("studio-ui.lock.json").items.find((i) => i.name === "jami-theme").version, "0.0.0-contract.20260609");
});

test("pinned items are skipped by update unless forced", () => {
  call("init");
  call("add", "jami-theme");
  call("pin", "jami-theme");
  const lock = readJson("studio-ui.lock.json");
  lock.items.find((i) => i.name === "jami-theme").version = "0.0.0-old";
  writeFileSync(join(dir, "studio-ui.lock.json"), `${JSON.stringify(lock, null, 2)}\n`);

  const r = call("update");
  assert.ok(r.result.notes.some((n) => n.code === "pinned"));
  assert.deepEqual(r.result.data.plannedUpdates ?? [], []);

  const forced = call("update", "--force");
  assert.equal(forced.result.status, "updated");
});

test("migrate reports and applies a schema-version migration", () => {
  call("init");
  call("add", "jami-theme");
  const lock = readJson("studio-ui.lock.json");
  lock.items.find((i) => i.name === "jami-theme").itemSchemaVersion = "2026-01-01.old";
  writeFileSync(join(dir, "studio-ui.lock.json"), `${JSON.stringify(lock, null, 2)}\n`);

  const pending = call("migrate", "jami-theme");
  assert.equal(pending.result.status, "pending");

  const applied = call("migrate", "jami-theme", "--apply");
  assert.equal(applied.code, 0);
  assert.equal(applied.result.status, "applied");
  assert.equal(
    readJson("studio-ui.lock.json").items.find((i) => i.name === "jami-theme").itemSchemaVersion,
    "2026-06-09.registry-foundation",
  );
});

test("provenance verifies installable theme and primitive content", () => {
  call("init");
  call("add", "jami-theme");
  const theme = call("provenance", "jami-theme");
  assert.equal(theme.code, 0);
  assert.ok(theme.result.data.files.every((f) => f.state === "verified"));

  const button = call("provenance", "button");
  assert.equal(button.code, 0);
  assert.ok(button.result.data.files.every((f) => f.state === "verified"));
});

test("remote registry is reported as unsupported, never silently empty", () => {
  call("init");
  const r = call("list", "--registry", "https://registry.jami.studio");
  assert.equal(r.code, 1);
  assert.equal(r.result.status, "registry-unavailable");
});

test("unknown item fails closed", () => {
  call("init");
  const r = call("add", "does-not-exist");
  assert.equal(r.code, 1);
  assert.equal(r.result.status, "missing");
});

// Deterministic, dependency-free checks for the Studio UI showcase surface.
//
// These run under `node --test` and are part of `pnpm verify`. They assert the
// page consumes real generated/fixture data, stays inert and escaped, tells the
// honest truth about installed vs pending surfaces, renders every theme, exposes
// accessible structure, and meets the contrast targets it displays. The real
// browser/screenshot pass lives in smoke/a11y-visual-smoke.mjs (run separately).

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { loadShowcaseData } from "../src/data.mjs";
import { THEMES, buildPage, computeContrastRows } from "../src/page.mjs";
import { contrastRatio, parseHex } from "../src/escape.mjs";
import {
  ARTIFACT_VERSION,
  createInitialWorkbenchState,
  factoryDraft,
  isDirty,
  parseWorkbenchState,
  reduceWorkbenchState,
  serializeWorkbenchState,
} from "../src/workbench-state.mjs";
import { build } from "../build.mjs";

const data = loadShowcaseData();
const page = buildPage(data, { theme: "factory" });
const pageSource = readFileSync(new URL("../src/page.mjs", import.meta.url), "utf8");

test("consumes real generated token values, not duplicated data", () => {
  // The warm factory anchor and teal focus ring come straight from jami.css.
  assert.ok(page.includes("#C14D84"), "accent token hex present");
  assert.ok(page.includes("#237C7A"), "focus-ring token hex present");
  assert.ok(page.includes("--jami-semantic-light-background"), "generated CSS var present");
  assert.ok(data.tokens.length >= 15, "parsed the generated token set");
});

test("loads selectable brand options from generated registry items", () => {
  assert.equal(data.brandOptions.length, 3);
  for (const id of ["command-grid", "editorial-studio", "studio-console"]) {
    const option = data.brandOptions.find((entry) => entry.descriptor.optionId === id);
    assert.ok(option, `${id} option loaded`);
    assert.equal(option.descriptor.canonicalBrand, false, `${id} does not claim final canon`);
    assert.equal(option.descriptor.provenance.copiedSource, false, `${id} is authored, not copied source`);
    assert.ok(option.descriptor.seedMaterial.usage.includes("Exploratory"), `${id} keeps seed material exploratory`);
    assert.ok(option.descriptor.tokenDeltas["semantic.light.accent"], `${id} has light accent delta`);
    assert.ok(option.descriptor.workbenchControls.accent, `${id} has selectable workbench controls`);
  }
});

test("showcase source stays tokenized and avoids decorative gradient backgrounds", () => {
  assert.equal(/#[0-9a-fA-F]{3,8}/.test(pageSource), false, "no literal hex colors in workbench source");
  assert.equal(/(?:radial|linear)-gradient/.test(pageSource), false, "no decorative gradient backgrounds");
});

test("consumes real registry + generated suite shell descriptors", () => {
  assert.ok(page.includes("@jami-studio/solo-suite"));
  assert.ok(page.includes("2026-06-09.registry-foundation"), "suite schema version echoed");
  assert.ok(page.includes("app.solo.shell"), "authored solo shell id rendered");
  assert.ok(page.includes("solo-app.implementation.json"), "solo app implementation evidence rendered");
  assert.ok(page.includes("renderable-primitive-factory-app"), "generated app implementation status rendered");
  assert.ok(page.includes("/business-ops/dashboard"), "business ops route rendered from shell");
  assert.ok(page.includes("block.mixed-media.assets"), "mixed media block graph rendered");
  assert.ok(page.includes("page.research-writing.sources"), "research-writing page graph rendered");
  // Real planned surfaces from the generated manifests.
  for (const surface of ["calendar", "forms", "docs", "agent", "tasks"]) {
    assert.ok(page.includes(`>${surface}<`), `solo planned surface ${surface} present`);
  }
});

test("exposes source-owned vocabulary handshake and prop schemas", () => {
  assert.equal(data.vocabularyHandshake.schemaVersion, "2026-06-09.vocabulary-handshake");
  assert.ok(data.vocabularyHandshake.payloadSchemaVersions.includes("2026-06-09"));
  assert.equal(data.componentVocabulary.length, 7);
  assert.equal(Object.keys(data.primitiveDescriptors).length, 7);
  assert.equal(Object.keys(data.primitiveComponentImplementations).length, 7);
  assert.ok(page.includes('id="vocabulary"'), "vocabulary evidence section rendered");
  assert.ok(page.includes("2026-06-09.ui-props"), "prop schema version surfaced");
  assert.ok(page.includes("framework-neutral-component-factory"), "component factory status surfaced honestly");
  assert.ok(page.includes("packages/ui/src/primitive-components.mjs"), "component factory source surfaced");
  assert.ok(page.includes("unsupported prop href for button"), "bad prop fixture reason is visible");
  assert.ok(page.includes("prop variant must be one of primary, secondary, ghost, danger"), "invalid enum fixture reason is visible");
});

test("renders the scoped Radix/React wrapper implementation evidence", () => {
  assert.deepEqual(data.implementedRadixReactWrapperNames, [
    "button",
    "panel",
    "text-field",
    "data-list",
    "agent-panel",
    "docs-source-panel",
    "media-grid",
  ]);
  assert.equal(data.radixReactWrapperExamples.length, 8);
  assert.ok(page.includes('id="radix-wrappers"'), "wrapper evidence section rendered");
  assert.ok(page.includes("Radix/React wrapper slice"), "wrapper slice heading visible");
  assert.ok(page.includes("packages/ui/src/radix-react-wrappers.mjs"), "wrapper source surfaced");
  assert.ok(page.includes("JamiButton"), "button wrapper export surfaced");
  assert.ok(page.includes("JamiPanel"), "panel wrapper export surfaced");
  assert.ok(page.includes("JamiTextField"), "text-field wrapper export surfaced");
  assert.ok(page.includes("JamiDataList"), "data-list wrapper export surfaced");
  assert.ok(page.includes("JamiAgentPanel"), "agent-panel wrapper export surfaced");
  assert.ok(page.includes("JamiDocsSourcePanel"), "docs-source-panel wrapper export surfaced");
  assert.ok(page.includes("JamiMediaGrid"), "media-grid wrapper export surfaced");
  assert.ok(page.includes("@radix-ui/react-slot@1.2.5"), "Radix Slot dependency surfaced");
  assert.ok(page.includes("@radix-ui/react-label@2.1.9"), "Radix Label dependency surfaced");
  assert.ok(page.includes('class="jami-button"'), "server-rendered button wrapper markup visible");
  assert.ok(page.includes('class="jami-panel"'), "server-rendered panel wrapper markup visible");
  assert.ok(page.includes('class="jami-field"'), "server-rendered text-field wrapper markup visible");
  assert.ok(page.includes('class="jami-data-list"'), "server-rendered data-list wrapper markup visible");
  assert.ok(page.includes('class="jami-agent-panel"'), "server-rendered agent-panel wrapper markup visible");
  assert.ok(page.includes('class="jami-docs-source-panel"'), "server-rendered docs-source-panel wrapper markup visible");
  assert.ok(page.includes('class="jami-media-grid"'), "server-rendered media-grid wrapper markup visible");
  assert.ok(page.includes("none in resident vocabulary"), "resident wrapper gaps are closed locally");
  for (const example of data.radixReactWrapperExamples) {
    assert.equal(/<script/i.test(example.html), false, `${example.id} has no script`);
    assert.equal(/<[^>]+\son[a-z]+\s*=/i.test(example.html), false, `${example.id} has no inline handler`);
    assert.equal(/javascript:/i.test(example.html), false, `${example.id} has no javascript URL`);
  }
});

test("all four lanes render generated suite shell routes without claiming React runtime", () => {
  for (const lane of ["solo", "business-ops", "mixed-media", "research-writing"]) {
    assert.ok(page.includes(`id="suite-${lane}"`), `${lane} section present`);
    assert.ok(data.suites.find((s) => s.lane === lane).manifest.shell, `${lane} generated shell present`);
    assert.ok(data.suites.find((s) => s.lane === lane).implementationEvidence.app, `${lane} app implementation present`);
    assert.equal(data.suites.find((s) => s.lane === lane).implementationEvidence.pages.length, 2, `${lane} page implementations`);
    assert.ok(data.suites.find((s) => s.lane === lane).implementationEvidence.blocks.length >= 4, `${lane} block implementations`);
  }
  const liveRouteBadges = page.match(/generated shell route/g) ?? [];
  assert.equal(liveRouteBadges.length, 4, "all four lanes render generated shell routes");
  assert.ok(page.includes("full React app runtime pending"), "runtime gap labelled");
});

test("does not fabricate runtime installs: generated shells and installable members are detected", () => {
  assert.ok(page.includes("full hosted React suite runtime"), "runtime gap is explicit");
  // Generated registry metadata is the source of truth for installability.
  for (const suite of data.suites) {
    assert.ok(suite.members.find((m) => m.name === "jami-theme"), `${suite.lane} theme member`);
    assert.ok(suite.members.find((m) => m.type === "registry:app"), `${suite.lane} app implementation member`);
    assert.ok(suite.members.every((m) => m.sourceState === "installable"), `${suite.lane} members installable`);
    assert.equal(suite.implementationEvidence.app.manifest.runtime.runtimeReactRenderer, false, `${suite.lane} no React runtime claim`);
    assert.equal(suite.implementationEvidence.app.manifest.runtime.hostedRuntime, false, `${suite.lane} no hosted runtime claim`);
    assert.equal(suite.implementationEvidence.app.manifest.runtime.harnessRuntimeExecution, false, `${suite.lane} no harness execution claim`);
  }
  assert.ok(page.includes("installable"), "installable state surfaced");
});

test("suite implementation evidence is generated from primitive factories", () => {
  const suite = data.suites.find((entry) => entry.lane === "solo");
  assert.equal(suite.implementationEvidence.app.manifest.primitiveFactory.source, "packages/ui/src/primitive-components.mjs");
  assert.equal(suite.implementationEvidence.app.manifest.primitiveFactory.runtimeReactRenderer, false);
  const block = suite.implementationEvidence.blocks.find((entry) =>
    entry.target.endsWith("solo-agenda-block.block.implementation.json"),
  );
  assert.ok(block, "solo agenda block implementation loaded from registry content");
  assert.equal(block.manifest.implementationStatus, "renderable-primitive-factory-block");
  assert.equal(block.manifest.renderedStates.ready.rendererState, "renderable");
  assert.equal(block.manifest.renderedStates["long-content"].rendererState, "renderable");
  assert.ok(block.manifest.evidence.tokenizedClasses.includes("jami-data-list"));
  assert.equal(block.manifest.runtime.executableActions, false);
  assert.ok(page.includes("Primitive-factory implementation evidence"), "suite evidence section visible");
});

test("output is inert: no inline event handlers, no javascript: URLs, one app-shell script", () => {
  assert.equal(/(href|src)\s*=\s*["']?\s*javascript:/i.test(page), false, "no javascript: URLs");
  assert.equal(/<[^>]+\son[a-z]+\s*=/i.test(page), false, "no inline event-handler attributes");
  const scriptTags = page.match(/<script/gi) ?? [];
  assert.equal(scriptTags.length, 1, "exactly one (theme switcher) script");
  assert.ok(page.includes("addEventListener"), "theme switcher uses addEventListener, not inline handlers");
});

test("always-live workbench overlay renders required status bar actions and panels", () => {
  for (const label of ["Target", "Theme", "State", "Save", "Discard", "Duplicate", "Rename", "Restore", "Register", "Export", "Close"]) {
    assert.ok(page.includes(`>${label}<`) || page.includes(`${label}</span>`), `${label} surfaced`);
  }
  for (const panel of ["Theme", "Color", "Typography", "Layout", "Surfaces", "Components", "Charts", "Motion", "Assets", "Registry"]) {
    assert.ok(page.includes(`<summary>${panel}</summary>`), `${panel} dock panel`);
  }
  assert.ok(page.includes("suite implementation manifests: 30"), "asset panel counts generated implementation manifests");
  assert.ok(page.includes('aria-label="Always-live workbench overlay"'), "overlay landmark labelled");
  assert.ok(page.includes('data-wb-action="save"'), "save action is first-party state transition");
  assert.ok(page.includes('data-wb-action="discard"'), "discard action is first-party state transition");
  assert.ok(page.includes('data-wb-action="rename"'), "rename action is first-party state transition");
  assert.ok(page.includes('data-wb-action="import"'), "import action is first-party state transition");
  assert.ok(page.includes('data-inspector-target="registry:@jami-studio/button"'), "inspector focus target is present");
  assert.ok(page.includes('data-wb-control="accent"'), "color control is data-backed");
  assert.ok(page.includes('data-wb-control="radius"'), "layout control is data-backed");
  assert.ok(page.includes('id="ju-wb-export" readonly'), "export artifact is local/read-only");
  for (const option of ["studio-console", "editorial-studio", "command-grid"]) {
    assert.ok(page.includes(`data-brand-option="${option}"`), `${option} selectable in overlay/page`);
  }
});

test("workbench state transitions are deterministic local draft/artifact flows", () => {
  let state = createInitialWorkbenchState();
  assert.equal(isDirty(state), false);
  state = reduceWorkbenchState(state, { type: "update-control", name: "radius", value: "6" });
  assert.equal(state.draft.controls.radius, "6");
  assert.equal(isDirty(state), true, "live edit marks draft dirty");
  state = reduceWorkbenchState(state, { type: "close" });
  assert.equal(state.overlayOpen, false, "close hides overlay");
  const reopened = reduceWorkbenchState(parseWorkbenchState(serializeWorkbenchState(state)), { type: "open" });
  assert.equal(reopened.overlayOpen, true, "open restores overlay");
  assert.equal(reopened.draft.controls.radius, "6", "draft survives close/reopen through local state");
  state = reduceWorkbenchState(reopened, { type: "save" });
  assert.equal(isDirty(state), false, "save persists the draft locally");
  state = reduceWorkbenchState(state, { type: "update-control", name: "radius", value: "4" });
  assert.equal(isDirty(state), true, "second edit marks draft dirty");
  state = reduceWorkbenchState(state, { type: "discard" });
  assert.equal(state.draft.controls.radius, "6", "discard returns to saved local draft");
  assert.equal(isDirty(state), false, "discard clears dirty state");
  state = reduceWorkbenchState(state, { type: "rename", themeName: "Evidence Theme", presetName: "evidence-theme" });
  assert.equal(state.draft.themeName, "Evidence Theme");
  assert.equal(state.draft.presetName, "evidence-theme");
  state = reduceWorkbenchState(state, { type: "duplicate" });
  assert.equal(state.draft.themeName, "Evidence Theme copy 1");
  assert.equal(isDirty(state), true, "duplicate creates a new unsaved draft");
  state = reduceWorkbenchState(state, { type: "register" });
  assert.equal(state.registeredArtifacts[0].schemaVersion, ARTIFACT_VERSION);
  assert.equal(state.registeredArtifacts[0].backendPersistence, false);
  state = reduceWorkbenchState(state, { type: "export" });
  assert.equal(state.exportArtifact.localOnly, true);
  state = reduceWorkbenchState(state, {
    type: "select-brand-option",
    presetName: "command-grid",
    themeName: "Command Grid",
    controls: { accent: "#315C8E", radius: "4" },
  });
  assert.equal(state.draft.presetName, "command-grid");
  assert.equal(state.draft.controls.accent, "#315C8E");
  assert.equal(state.lastAction, "selected-brand-option");
  state = reduceWorkbenchState(state, { type: "focus-inspector", target: "registry:@jami-studio/button" });
  assert.equal(state.inspectorFocus, "registry:@jami-studio/button");
  state = reduceWorkbenchState(state, { type: "set-online", online: false });
  assert.equal(state.online, false);
  const rejected = reduceWorkbenchState(state, { type: "import", artifact: { schemaVersion: "bad" } });
  assert.equal(rejected.lastAction, "import-rejected");
  assert.equal(rejected.conflict.kind, "invalid-import");
  const imported = reduceWorkbenchState(state, {
    type: "import",
    artifact: {
      schemaVersion: ARTIFACT_VERSION,
      target: "suite.solo",
      themeName: "Imported",
      presetName: "imported",
      controls: { radius: "5", accent: "#315C8E" },
    },
  });
  assert.equal(imported.draft.themeName, "Imported");
  assert.equal(imported.draft.controls.radius, "5");
  assert.equal(imported.conflict, null);
  state = reduceWorkbenchState(state, { type: "restore" });
  assert.deepEqual(state.draft, factoryDraft, "restore returns the draft to factory");
});

test("renders the resident renderer fixtures, including fail-closed states", () => {
  // A renderable button payload becomes a real <button>.
  assert.ok(/<button[^>]*class="ju-btn"[^>]*>Save<\/button>/.test(page), "Save button rendered");
  // At least one invalid fixture fails closed to the renderer-owned fallback.
  assert.ok(page.includes("Invalid (failed closed)"), "invalid badge present");
  assert.ok(
    page.includes("rejected by the resident renderer"),
    "renderer-owned fallback copy present",
  );
  // A denied action is shown as denied, display-only.
  assert.ok(page.includes("Denied by harness policy"));
  assert.ok(page.includes(">Denied<") || page.includes("Denied"), "denied state surfaced");
  assert.ok(page.includes("unsupported vocabularyHandshakeVersion"), "stale vocabulary handshake rejection surfaced");
});

test("renders workbench presentation panels with operational statuses", () => {
  for (const status of ["ready", "redacted", "stale", "empty", "error", "denied", "missing-source", "loading"]) {
    assert.ok(
      page.includes(`data-status="${status}"`),
      `presentation status ${status} appears`,
    );
  }
});

test("never echoes redacted memory content", () => {
  // memory-record.redacted fixture gates its content; the literal must not leak.
  const redacted = data.presentationPanels.find((p) => p.file === "memory-record.redacted.json");
  assert.ok(redacted, "redacted memory fixture loaded");
  assert.equal(redacted.presented.status, "redacted");
  assert.equal(redacted.presented.descriptor.body.content, null, "content gated to null");
});

test("every theme builds and sets the active pressed control", () => {
  for (const theme of THEMES) {
    const themed = buildPage(data, { theme });
    assert.ok(themed.includes(`data-theme="${theme}"`), `html data-theme=${theme}`);
    assert.ok(
      themed.includes(`data-theme-value="${theme}"`) &&
        new RegExp(`data-theme-value="${theme}"[^>]*aria-pressed="true"`).test(themed),
      `${theme} control pressed`,
    );
  }
});

test("accessible structure: skip link, landmarks, labelled groups, scoped headers", () => {
  assert.ok(page.includes('class="ju-skip" href="#ju-main"'), "skip link");
  assert.ok(page.includes('<main id="ju-main">'), "main landmark");
  assert.ok(/<nav class="ju-nav" aria-label="Sections">/.test(page), "labelled nav");
  assert.ok(page.includes('role="group" aria-label="Theme"'), "labelled theme group");
  assert.ok(page.includes('scope="col"'), "table headers are scoped");
  assert.ok(page.includes('lang="en"'), "document language set");
});

test("brand option section presents default kit choices without final-brand claims", () => {
  assert.ok(page.includes('id="brand-options"'), "default kit options section");
  for (const title of ["Studio Console", "Editorial Studio", "Command Grid"]) {
    assert.ok(page.includes(title), `${title} presented`);
  }
  assert.ok(page.includes("not final canon"), "canon status surfaced");
  assert.ok(page.includes("CLI inspectable"), "registry/CLI choice surface signposted");
  assert.equal(/brand canon<\/dt><dd>final<\/dd>/.test(page), false, "no option is presented as final canon");
});

test("responsive + reduced-motion affordances are present", () => {
  assert.ok(page.includes('name="viewport"'), "viewport meta");
  assert.ok(page.includes("@media (max-width: 640px)"), "narrow-viewport layout");
  assert.ok(page.includes("prefers-reduced-motion: reduce"), "reduced-motion guard");
});

test("long content wraps instead of overflowing", () => {
  assert.ok(page.includes("overflow-wrap: anywhere"), "long ids/hashes wrap");
  // A genuinely long real value is on the page and relies on wrapping: the solo
  // suite's full descriptor sentence from the generated registry item and shell.
  const solo = data.suites.find((s) => s.lane === "solo");
  assert.ok(solo.item.description.length > 80, "real long descriptor exists");
  assert.ok(page.includes(solo.item.description), "long descriptor rendered on the page");
  assert.ok(page.includes(solo.manifest.shell.stateFixtures.longContent), "long-content state rendered");
});

test("displayed contrast ratios are computed correctly and meet their targets", () => {
  const rows = computeContrastRows(data.tokens);
  assert.ok(rows.length >= 4);
  for (const row of rows) {
    assert.ok(parseHex(row.fg), `fg ${row.fg} is a hex`);
    assert.ok(parseHex(row.bg), `bg ${row.bg} is a hex`);
    assert.equal(row.ratio, contrastRatio(row.fg, row.bg), "ratio recomputes identically");
    assert.ok(row.ratio >= row.min, `${row.label} meets ${row.min}:1 (got ${row.ratio})`);
  }
  // Body text pairs must clear WCAG AA for normal text.
  const lightText = rows.find((r) => r.label.startsWith("Light text"));
  assert.ok(lightText.ratio >= 4.5, `light body text AA (got ${lightText.ratio})`);
});

test("build() emits the page and per-theme files from real sources", () => {
  const result = build();
  for (const file of ["index.html", "theme-factory.html", "theme-light.html", "theme-dark.html", "focus.html", "build-manifest.json"]) {
    assert.ok(result.written.includes(file), `emitted ${file}`);
    assert.ok(existsSync(join(result.distDir, file)), `${file} exists on disk`);
  }
  assert.equal(result.counts.suites, 4);
  assert.ok(result.counts.compatibilityFixtures >= 10);
  assert.ok(result.counts.presentationPanels >= 10);
});

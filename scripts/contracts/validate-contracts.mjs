import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { generateAllArtifacts, registrySourceHash } from "./generate-contract-artifacts.mjs";
// The resident renderer owns the security-critical primitives (allowlist,
// unsafe-payload scan, secret-key set). The contract check imports them so the
// fixture gate and the runtime renderer can never enforce different rules.
import { allowedComponents, scanUnsafePayload } from "../../packages/renderer/src/safe-payload.mjs";
import {
  UI_PAYLOAD_SCHEMA_VERSION,
  UI_PROP_SCHEMA_VERSION,
  UI_VOCABULARY_HANDSHAKE_VERSION,
  UI_VOCABULARY_SCHEMA_VERSION,
  componentVocabulary,
  validateComponentProps,
  vocabularyHandshake,
} from "../../packages/ui/src/index.mjs";
// The workbench presentation seam is exercised by the contract gate so the
// presentation fixtures cannot drift from the seam that consumes them.
import { presentWorkbenchPanel } from "../../packages/renderer/src/presentation.mjs";

const root = process.cwd();
const failures = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(join(root, path), "utf8"));
  } catch (error) {
    failures.push(`${path}: invalid JSON: ${error.message}`);
    return undefined;
  }
}

function listJson(dir) {
  return readdirSync(join(root, dir))
    .filter((name) => name.endsWith(".json"))
    .map((name) => `${dir}/${name}`);
}

function fail(path, message) {
  failures.push(`${path}: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function flattenTokens(node, prefix = [], out = new Map()) {
  if (!isObject(node)) return out;
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (isObject(value) && "$value" in value) {
      out.set([...prefix, key].join("."), value);
    } else if (isObject(value)) {
      flattenTokens(value, [...prefix, key], out);
    }
  }
  return out;
}

function tokenReferences(value, refs = []) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\{([^}]+)\}/g)) refs.push(match[1]);
  } else if (Array.isArray(value)) {
    for (const item of value) tokenReferences(item, refs);
  } else if (isObject(value)) {
    for (const item of Object.values(value)) tokenReferences(item, refs);
  }
  return refs;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return undefined;
  const n = Number.parseInt(normalized, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;
  const channels = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === undefined || lb === undefined) return undefined;
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveTokenValue(tokenMap, ref) {
  const token = tokenMap.get(ref);
  if (!token) return undefined;
  const value = token.$value;
  if (typeof value === "string") {
    const match = value.match(/^\{([^}]+)\}$/);
    if (match) return resolveTokenValue(tokenMap, match[1]);
  }
  return value;
}

function validateTokenFixture(path, shouldPass) {
  const data = readJson(path);
  if (!data) return;
  const localFailures = [];
  const tokenMap = flattenTokens(data.tokens);
  const meta = data.$extensions?.["studio-ui"];

  if (data.$schema !== "https://jami.studio/schemas/tokens/token-set.schema.json") {
    localFailures.push("missing Studio UI token schema URL");
  }
  if (!meta?.schemaVersion || !meta?.migration?.current) {
    localFailures.push("missing schemaVersion or migration metadata");
  }
  for (const required of ["color.brand.accent", "semantic.light.background", "semantic.light.foreground", "semantic.dark.background", "semantic.dark.foreground"]) {
    if (!tokenMap.has(required)) localFailures.push(`missing required token ${required}`);
  }
  for (const [name, token] of tokenMap) {
    if (!token.$type) localFailures.push(`${name} missing $type`);
    for (const ref of tokenReferences(token.$value)) {
      if (!tokenMap.has(ref)) localFailures.push(`${name} references missing token ${ref}`);
    }
  }
  for (const mode of ["light", "dark"]) {
    const bg = resolveTokenValue(tokenMap, `semantic.${mode}.background`);
    const fg = resolveTokenValue(tokenMap, `semantic.${mode}.foreground`);
    const ratio = typeof bg === "string" && typeof fg === "string" ? contrastRatio(bg, fg) : undefined;
    if (ratio === undefined || ratio < 4.5) {
      localFailures.push(`${mode} foreground/background contrast is below 4.5`);
    }
  }
  const generated = meta?.generatedOutputs;
  for (const output of ["cssVariables", "tailwindTheme", "typescriptTypes", "shadcnCssVars"]) {
    if (!generated?.[output]) localFailures.push(`missing generated output target ${output}`);
  }

  if (shouldPass && localFailures.length > 0) fail(path, localFailures.join("; "));
  if (!shouldPass && localFailures.length === 0) fail(path, "expected invalid token fixture to fail");
}

function validateRegistryFixture(path, shouldPass) {
  const item = readJson(path);
  if (!item) return;
  const localFailures = [];
  if (item.$schema !== "https://jami.studio/schemas/registry/registry-item.schema.json") {
    localFailures.push("missing Studio UI registry schema URL");
  }
  if (!/^@jami-studio\/[a-z0-9][a-z0-9-]*$/.test(item.name ?? "")) {
    localFailures.push("name must use @jami-studio namespace");
  }
  if (!["primitive", "component", "block", "page", "theme", "font", "app", "suite"].includes(item.type)) {
    localFailures.push("unsupported registry item type");
  }
  for (const field of ["id", "version", "schemaVersion", "sourceHash"]) {
    if (!item.lifecycle?.[field]) localFailures.push(`missing lifecycle.${field}`);
  }
  if (item.lifecycle?.sourceHash && !/^sha256:[0-9a-f]{64}$/.test(item.lifecycle.sourceHash)) {
    localFailures.push("lifecycle.sourceHash must be a sha256 digest");
  }
  if (item.lifecycle?.sourceHash && item.lifecycle.sourceHash !== registrySourceHash(item)) {
    localFailures.push("lifecycle.sourceHash does not match registry source item");
  }
  if (!Array.isArray(item.files) || item.files.length === 0) localFailures.push("missing install files");
  if (item.type === "suite") {
    const lane = item.suite;
    const shellPath = lane ? `registry/suites/${lane}/suite-shell.json` : null;
    const shell = shellPath ? readJson(shellPath) : null;
    if (!shell) {
      localFailures.push("suite item must have an authored suite shell source");
    } else {
      if (shell.$schema !== "https://jami.studio/schemas/registry/suite-shell.source.json") {
        localFailures.push("suite shell source has wrong schema URL");
      }
      if (shell.lane !== lane) localFailures.push("suite shell lane must match registry item suite");
      if (!shell.appShell?.id || !Array.isArray(shell.appShell?.navigation) || shell.appShell.navigation.length === 0) {
        localFailures.push("suite shell must carry appShell id and navigation");
      }
      if (!Array.isArray(shell.routes) || shell.routes.length === 0) localFailures.push("suite shell must carry routes");
      if (!Array.isArray(shell.pages) || shell.pages.length === 0) localFailures.push("suite shell must carry pages");
      if (!Array.isArray(shell.blocks) || shell.blocks.length === 0) localFailures.push("suite shell must carry blocks");
      const routePages = new Set((shell.routes ?? []).map((route) => route.page));
      const pages = new Set((shell.pages ?? []).map((page) => page.id));
      const blocks = new Map((shell.blocks ?? []).map((block) => [block.id, block]));
      for (const pageId of routePages) {
        if (!pages.has(pageId)) localFailures.push(`suite route references missing page ${pageId}`);
      }
      for (const route of shell.routes ?? []) {
        for (const blockId of route.blocks ?? []) {
          if (!blocks.has(blockId)) localFailures.push(`suite route ${route.path} references missing block ${blockId}`);
        }
      }
      const components = new Set([
        ...(shell.pages ?? []).flatMap((page) => page.components ?? []),
        ...(shell.blocks ?? []).map((block) => block.component),
      ]);
      for (const component of components) {
        if (component && !allowedComponents.has(component)) {
          localFailures.push(`suite shell references non-resident component ${component}`);
        }
      }
      for (const state of ["longContent", "empty", "error"]) {
        if (!shell.stateFixtures?.[state]) localFailures.push(`suite shell missing ${state} state fixture`);
      }
    }
  }
  if (!item.provenance?.source || !item.provenance?.license || !item.provenance?.reviewedAt) {
    localFailures.push("missing provenance source, license, or reviewedAt");
  }
  if (!item.compatibility?.shadcn || !item.compatibility?.tailwind || !item.compatibility?.react) {
    localFailures.push("missing compatibility ranges");
  }
  if (!Array.isArray(item.tokenRequirements)) localFailures.push("missing tokenRequirements array");
  if (item.brandOption) {
    const descriptorPath = item.brandOption.descriptor;
    const descriptor = descriptorPath ? readJson(descriptorPath) : null;
    if (item.type !== "theme") localFailures.push("brandOption registry entries must be theme items");
    if (item.brandOption.canonicalBrand !== false) localFailures.push("brandOption must not claim final brand canon");
    if (!descriptor) {
      localFailures.push("brandOption must point at an authored descriptor");
    } else {
      if (descriptor.$schema !== "https://jami.studio/schemas/registry/brand-option.source.json") {
        localFailures.push("brandOption descriptor has wrong schema URL");
      }
      if (descriptor.optionId !== item.brandOption.optionId) {
        localFailures.push("brandOption optionId must match descriptor optionId");
      }
      if (descriptor.canonicalBrand !== false) {
        localFailures.push("brandOption descriptor must not claim final brand canon");
      }
      if (descriptor.provenance?.copiedSource !== false) {
        localFailures.push("brandOption descriptor must record copiedSource false");
      }
      if (!descriptor.seedMaterial?.usage?.includes("Exploratory")) {
        localFailures.push("brandOption descriptor must keep branding seed material exploratory");
      }
      for (const token of item.tokenRequirements) {
        if (!Object.hasOwn(descriptor.tokenDeltas ?? {}, token)) {
          localFailures.push(`brandOption descriptor missing token delta ${token}`);
        }
      }
      for (const control of ["accent", "focusRing", "radius", "spacing", "density", "motion", "dockWidth", "fontSize"]) {
        if (descriptor.workbenchControls?.[control] === undefined) {
          localFailures.push(`brandOption descriptor missing workbench control ${control}`);
        }
      }
    }
  }

  if (shouldPass && localFailures.length > 0) fail(path, localFailures.join("; "));
  if (!shouldPass && localFailures.length === 0) fail(path, "expected invalid registry fixture to fail");
}

// Every fixture kind maps to exactly one renderer state. The renderer state is the
// display contract: a denied action must display denied, an approval/display reference
// must stay display-only, and a payload must not silently claim a more permissive state
// than its kind allows. Mislabeling here would let a harness-owned policy decision
// (denied / pending approval) present as a renderable surface.
const expectedStateByKind = new Map([
  ["uiPayload", "renderable"],
  ["unsupportedComponent", "unsupported"],
  ["invalidPayload", "invalid"],
  ["deniedAction", "denied"],
  ["actionRef", "display-only"],
  ["artifactView", "display-only"],
  ["themeRef", "display-only"],
  ["suiteRef", "display-only"],
  ["rendererError", "error"],
]);
const expectedHarnessSchemaIds = new Map([
  ["uiPayload", "https://jami.studio/schemas/harness/ui-payload.schema.json"],
  ["unsupportedComponent", "https://jami.studio/schemas/harness/ui-payload.schema.json"],
  ["invalidPayload", "https://jami.studio/schemas/harness/ui-payload.schema.json"],
  ["deniedAction", "https://jami.studio/schemas/harness/action-ref.schema.json"],
  ["actionRef", "https://jami.studio/schemas/harness/action-ref.schema.json"],
  ["artifactView", "https://jami.studio/schemas/harness/artifact-view.schema.json"],
  ["themeRef", "https://jami.studio/schemas/harness/theme-ref.schema.json"],
  ["suiteRef", "https://jami.studio/schemas/harness/suite-ref.schema.json"],
  ["rendererError", "https://jami.studio/schemas/harness/run-event.schema.json"],
]);

// Renderer payload props are display data. The unsafe-payload scan, resident
// allowlist, and secret-bearing key set are imported from the renderer's
// safe-payload guard so the fixture gate and the runtime renderer stay in lock
// step. Event-handler props (`onClick`/`onclick`/`onerror`/...), escape-hatch
// markers, package imports, HTML-like strings, `javascript:` URLs, and inline
// secrets are all rejected there.

function validateHarnessUiPayload(payload, localFailures, { allowUnsupported = false } = {}) {
  if (!payload) {
    localFailures.push("missing payload");
    return;
  }
  if (payload.schemaVersion !== UI_PAYLOAD_SCHEMA_VERSION) {
    localFailures.push(`payload schemaVersion must be ${UI_PAYLOAD_SCHEMA_VERSION}`);
  }
  if (payload.vocabularyHandshakeVersion !== vocabularyHandshake.schemaVersion) {
    localFailures.push(`payload vocabularyHandshakeVersion must be ${vocabularyHandshake.schemaVersion}`);
  }
  if (!/^uip_[a-z0-9][a-z0-9_-]*$/.test(payload.payloadId ?? "")) localFailures.push("payloadId must use uip_ prefix");
  const component = payload.componentRef;
  if (component?.namespace !== "@jami-studio/ui") localFailures.push("componentRef namespace must be @jami-studio/ui");
  if (!/^[a-z][a-z0-9-]*$/.test(component?.name ?? "")) localFailures.push("componentRef name must be kebab-case");
  if (!component?.version) localFailures.push("componentRef version is required");
  if (!allowUnsupported && !allowedComponents.has(component?.name)) {
    localFailures.push(`component ${component?.name} is not allowlisted`);
  }
  if (allowUnsupported && component?.allowlisted !== false) {
    localFailures.push("unsupported component fixture must mark componentRef.allowlisted false");
  }
  for (const actionRef of payload.actionRefs ?? []) {
    if (!/^act_[a-z0-9][a-z0-9_-]*$/.test(actionRef)) localFailures.push(`actionRef ${actionRef} must use act_ prefix`);
  }
  for (const artifactViewRef of payload.artifactViewRefs ?? []) {
    if (!/^artv_[a-z0-9][a-z0-9_-]*$/.test(artifactViewRef)) {
      localFailures.push(`artifactViewRef ${artifactViewRef} must use artv_ prefix`);
    }
  }
  if (payload.themeRef && !/^theme_[a-z0-9][a-z0-9_-]*$/.test(payload.themeRef)) localFailures.push("themeRef must use theme_ prefix");
  if (payload.suiteRef && !/^suite_[a-z0-9][a-z0-9_-]*$/.test(payload.suiteRef)) localFailures.push("suiteRef must use suite_ prefix");
  if (!payload.fallback?.mode || !payload.fallback?.message) localFailures.push("payload fallback mode and message are required");
  if (payload.provenance && !/^run_[a-z0-9][a-z0-9_-]*$/.test(payload.provenance.runId ?? "")) {
    localFailures.push("payload provenance runId must use run_ prefix");
  }
  scanUnsafePayload(payload.props, localFailures);
  scanUnsafePayload(payload.children, localFailures);
  if (allowedComponents.has(component?.name)) {
    localFailures.push(...validateComponentProps(component.name, payload.props ?? {}));
  }
}

function validateUiVocabulary() {
  const localFailures = [];
  if (vocabularyHandshake.schemaVersion !== UI_VOCABULARY_HANDSHAKE_VERSION) {
    localFailures.push("vocabulary handshake version export drifted");
  }
  if (!vocabularyHandshake.payloadSchemaVersions.includes(UI_PAYLOAD_SCHEMA_VERSION)) {
    localFailures.push("vocabulary handshake must accept the renderer payload schema version");
  }
  if (vocabularyHandshake.vocabularyVersion !== UI_VOCABULARY_SCHEMA_VERSION) {
    localFailures.push("vocabulary handshake must reference the current vocabulary version");
  }
  if (vocabularyHandshake.propSchemaVersion !== UI_PROP_SCHEMA_VERSION) {
    localFailures.push("vocabulary handshake must reference the current prop schema version");
  }
  for (const definition of componentVocabulary) {
    const schema = definition.propSchema;
    if (schema.schemaVersion !== UI_PROP_SCHEMA_VERSION) {
      localFailures.push(`${definition.name} prop schema version drift`);
    }
    if (schema.additionalProperties !== false) {
      localFailures.push(`${definition.name} prop schema must reject additional properties`);
    }
    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      localFailures.push(`${definition.name} prop schema must declare properties`);
    }
  }
  if (localFailures.length > 0) fail("packages/ui/src/vocabulary.mjs", localFailures.join("; "));
}

function validateRendererFixture(path, shouldPass) {
  const fixture = readJson(path);
  if (!fixture) return;
  const localFailures = [];
  if (fixture.$schema !== "https://jami.studio/schemas/renderer/compatibility-fixture.schema.json") {
    localFailures.push("missing Studio UI renderer compatibility schema URL");
  }
  if (!fixture.fixtureId || !fixture.kind || !fixture.expectedRendererState) {
    localFailures.push("missing fixture id, kind, or expectedRendererState");
  }
  const expectedHarnessSchemaId = expectedHarnessSchemaIds.get(fixture.kind);
  if (expectedHarnessSchemaId && fixture.harnessSchemaId !== expectedHarnessSchemaId) {
    localFailures.push(`harnessSchemaId must be ${expectedHarnessSchemaId}`);
  }
  const expectedState = expectedStateByKind.get(fixture.kind);
  if (expectedState && fixture.expectedRendererState !== expectedState) {
    localFailures.push(`kind ${fixture.kind} must declare expectedRendererState ${expectedState}`);
  }

  if (fixture.kind === "uiPayload") {
    validateHarnessUiPayload(fixture.payload, localFailures);
  }
  if (fixture.kind === "unsupportedComponent") {
    validateHarnessUiPayload(fixture.payload, localFailures, { allowUnsupported: true });
    if (fixture.payload?.fallback?.mode !== "unsupported_component") {
      localFailures.push("unsupported component fixture must carry unsupported_component fallback");
    }
  }
  if (fixture.kind === "actionRef") {
    const actionRef = fixture.actionRef;
    if (actionRef?.schemaVersion !== "2026-06-09") localFailures.push("actionRef schemaVersion must be 2026-06-09");
    if (!/^act_[a-z0-9][a-z0-9_-]*$/.test(actionRef?.actionId ?? "")) localFailures.push("actionId must use act_ prefix");
    if (!/^harness:\/\/actions\/[a-z0-9][a-z0-9-]*$/.test(actionRef?.route ?? "")) localFailures.push("actionRef route must use harness://actions/");
    if (!["available", "disabled", "pending_approval"].includes(actionRef?.state)) {
      localFailures.push("actionRef display fixture state must be available, disabled, or pending_approval");
    }
    if (!actionRef?.policyScope) localFailures.push("actionRef display fixture must carry policyScope");
    if (actionRef?.execution?.canExecute !== undefined) localFailures.push("actionRef display fixture must not carry executable UI state");
  }
  if (fixture.kind === "deniedAction") {
    const actionRef = fixture.actionRef;
    if (actionRef?.schemaVersion !== "2026-06-09") localFailures.push("actionRef schemaVersion must be 2026-06-09");
    if (!/^act_[a-z0-9][a-z0-9_-]*$/.test(actionRef?.actionId ?? "")) localFailures.push("actionId must use act_ prefix");
    if (!/^harness:\/\/actions\/[a-z0-9][a-z0-9-]*$/.test(actionRef?.route ?? "")) localFailures.push("actionRef route must use harness://actions/");
    if (actionRef?.state !== "denied") localFailures.push("denied action fixture must carry denied state");
    if (!actionRef?.denial?.auditRef) localFailures.push("denied action fixture must carry denial auditRef");
    if (actionRef?.execution?.canExecute !== undefined) localFailures.push("denied action fixture must not carry executable UI state");
  }
  if (fixture.kind === "artifactView") {
    const artifactView = fixture.artifactView;
    if (artifactView?.schemaVersion !== "2026-06-09") localFailures.push("artifactView schemaVersion must be 2026-06-09");
    if (!/^artv_[a-z0-9][a-z0-9_-]*$/.test(artifactView?.artifactViewId ?? "")) localFailures.push("artifactViewId must use artv_ prefix");
    if (!/^art_[a-z0-9][a-z0-9_-]*$/.test(artifactView?.artifactId ?? "")) localFailures.push("artifactId must use art_ prefix");
    if (!artifactView?.renderers?.length) localFailures.push("artifactView fixture must carry renderers");
    if (!artifactView?.provenance?.evidenceRef) localFailures.push("artifactView fixture must carry evidenceRef");
  }
  if (fixture.kind === "themeRef") {
    const themeRef = fixture.themeRef;
    if (themeRef?.schemaVersion !== "2026-06-09") localFailures.push("themeRef schemaVersion must be 2026-06-09");
    if (!/^theme_[a-z0-9][a-z0-9_-]*$/.test(themeRef?.themeId ?? "")) localFailures.push("themeId must use theme_ prefix");
    if (!themeRef?.tokenSchemaVersion) localFailures.push("themeRef fixture must carry tokenSchemaVersion");
    if (themeRef?.source?.owner !== "studio-ui") localFailures.push("themeRef source owner must be studio-ui");
    if (themeRef?.restoreTarget?.packageName !== "@jami-studio/ui") localFailures.push("themeRef restoreTarget packageName must be @jami-studio/ui");
  }
  if (fixture.kind === "suiteRef") {
    const suiteRef = fixture.suiteRef;
    if (suiteRef?.schemaVersion !== "2026-06-09") localFailures.push("suiteRef schemaVersion must be 2026-06-09");
    if (!/^suite_[a-z0-9][a-z0-9_-]*$/.test(suiteRef?.suiteId ?? "")) localFailures.push("suiteId must use suite_ prefix");
    if (!suiteRef?.installedItems?.length) localFailures.push("suiteRef fixture must carry installedItems");
    if (!suiteRef?.routeMap?.length) localFailures.push("suiteRef fixture must carry routeMap");
  }
  if (fixture.kind === "rendererError") {
    if (!fixture.rendererError?.code) localFailures.push("rendererError fixture must carry code");
    const runEvent = fixture.rendererError?.runEvent;
    if (runEvent?.eventType !== "renderer.error") localFailures.push("rendererError fixture must carry renderer.error runEvent");
    if (runEvent?.rendererState !== "error_state") localFailures.push("rendererError runEvent must carry error_state");
  }
  if (fixture.kind === "invalidPayload") {
    validateHarnessUiPayload(fixture.payload, localFailures);
    if (fixture.payload?.fallback?.mode !== "invalid_payload") {
      localFailures.push("invalid payload fixture must carry invalid_payload fallback");
    }
  }

  if (shouldPass && localFailures.length > 0) fail(path, localFailures.join("; "));
  if (!shouldPass && localFailures.length === 0) fail(path, "expected invalid renderer fixture to fail");
}

// The presentation seam consumes only shared harness refs. Each presentation
// fixture must point at a real harness schema id for its kind, and the seam must
// produce the exact operational status the fixture declares. memoryContext
// mirrors two harness contracts (memoryRecord and contextPack), so it accepts
// either schema id. This keeps the workbench presentation from drifting into a
// parallel artifact/trace/memory/context data shape.
const presentationHarnessSchemaIds = new Map([
  ["artifactView", ["https://jami.studio/schemas/harness/artifact-view.schema.json"]],
  ["evidencePacket", ["https://jami.studio/schemas/harness/evidence-packet.schema.json"]],
  ["trace", ["https://jami.studio/schemas/harness/run-event.schema.json"]],
  [
    "memoryContext",
    [
      "https://jami.studio/schemas/harness/memory-record.schema.json",
      "https://jami.studio/schemas/harness/context-pack.schema.json",
    ],
  ],
  ["actionRef", ["https://jami.studio/schemas/harness/action-ref.schema.json"]],
]);

function validatePresentationFixture(path) {
  const fixture = readJson(path);
  if (!fixture) return;
  const localFailures = [];
  if (fixture.$schema !== "https://jami.studio/schemas/renderer/presentation-fixture.schema.json") {
    localFailures.push("missing Studio UI presentation fixture schema URL");
  }
  if (!fixture.panelId || !fixture.kind || !fixture.expectedPresentationStatus) {
    localFailures.push("missing panelId, kind, or expectedPresentationStatus");
  }
  const allowedSchemaIds = presentationHarnessSchemaIds.get(fixture.kind);
  if (allowedSchemaIds) {
    if (!allowedSchemaIds.includes(fixture.harnessSchemaId)) {
      localFailures.push(`harnessSchemaId must be one of ${allowedSchemaIds.join(", ")}`);
    }
    // A ref-backed kind must actually carry a harness ref (unless it is a
    // lifecycle-only loading panel), proving the seam consumes shared data.
    if (fixture.lifecycle !== "loading" && fixture.ref == null) {
      localFailures.push(`${fixture.kind} fixture must carry a harness ref`);
    }
  }
  // The seam must compute exactly the declared operational status.
  const result = presentWorkbenchPanel(fixture);
  if (result.status !== fixture.expectedPresentationStatus) {
    localFailures.push(
      `presentation seam produced status ${result.status}, expected ${fixture.expectedPresentationStatus}`,
    );
  }
  // The presented descriptor must never carry an unsafe value.
  for (const unsafe of scanUnsafePayload(result.descriptor)) {
    localFailures.push(`descriptor leaked unsafe value: ${unsafe}`);
  }
  if (localFailures.length > 0) fail(path, localFailures.join("; "));
}

function validateGeneratedRegistry() {
  const registry = readJson("packages/registry/generated/registry.json");
  if (!registry) return;
  const localFailures = [];
  const items = registry.items ?? [];
  const byName = new Map(items.map((item) => [item.name, item]));
  const pageItems = items.filter((item) => item.type === "registry:page");
  const blockItems = items.filter((item) => item.type === "registry:block");
  if (pageItems.length !== 8) localFailures.push(`expected 8 generated page items, got ${pageItems.length}`);
  if (blockItems.length !== 18) localFailures.push(`expected 18 generated block items, got ${blockItems.length}`);
  for (const item of items) {
    if (!item.meta?.lifecycle?.sourceHash?.startsWith("sha256:")) {
      localFailures.push(`${item.name} missing generated lifecycle source hash`);
    }
    if (!Array.isArray(item.files) || item.files.length === 0) {
      localFailures.push(`${item.name} missing generated files`);
    }
    for (const file of item.files ?? []) {
      if (typeof file.content !== "string" || !file.hash?.startsWith("sha256:")) {
        localFailures.push(`${item.name} -> ${file.target} is not installable with content hash`);
      }
    }
    for (const dependency of item.registryDependencies ?? []) {
      if (!byName.has(dependency)) localFailures.push(`${item.name} references missing dependency ${dependency}`);
    }
  }
  for (const suite of items.filter((item) => item.type === "registry:suite")) {
    const deps = suite.registryDependencies ?? [];
    if (!deps.some((name) => byName.get(name)?.type === "registry:page")) {
      localFailures.push(`${suite.name} does not expose page item dependencies`);
    }
    if (!deps.some((name) => byName.get(name)?.type === "registry:block")) {
      localFailures.push(`${suite.name} does not expose block item dependencies`);
    }
  }
  for (const page of pageItems) {
    const manifestFile = page.files?.[0]?.path;
    const manifest = manifestFile ? readJson(manifestFile) : null;
    if (manifest?.$schema !== "https://jami.studio/schemas/registry/suite-page.generated.json") {
      localFailures.push(`${page.name} generated page manifest has wrong schema`);
    }
    if (!manifest?.routes?.length || !manifest?.blocks?.length || !manifest?.components?.length) {
      localFailures.push(`${page.name} generated page manifest missing routes, blocks, or components`);
    }
    for (const component of manifest?.components ?? []) {
      if (!allowedComponents.has(component)) localFailures.push(`${page.name} references non-resident component ${component}`);
    }
  }
  for (const block of blockItems) {
    const manifestFile = block.files?.[0]?.path;
    const manifest = manifestFile ? readJson(manifestFile) : null;
    if (manifest?.$schema !== "https://jami.studio/schemas/registry/suite-block.generated.json") {
      localFailures.push(`${block.name} generated block manifest has wrong schema`);
    }
    if (!manifest?.block?.id || !manifest?.component) {
      localFailures.push(`${block.name} generated block manifest missing block or component`);
    }
    if (manifest?.component && !allowedComponents.has(manifest.component)) {
      localFailures.push(`${block.name} references non-resident component ${manifest.component}`);
    }
  }
  if (localFailures.length > 0) fail("packages/registry/generated/registry.json", localFailures.join("; "));
}

for (const path of listJson("packages/tokens/fixtures/valid")) validateTokenFixture(path, true);
for (const path of listJson("packages/tokens/fixtures/invalid")) validateTokenFixture(path, false);
for (const path of listJson("packages/registry/fixtures/valid")) validateRegistryFixture(path, true);
for (const path of listJson("packages/registry/fixtures/invalid")) validateRegistryFixture(path, false);
for (const path of listJson("packages/renderer/fixtures/compatibility/valid")) validateRendererFixture(path, true);
for (const path of listJson("packages/renderer/fixtures/compatibility/invalid")) validateRendererFixture(path, false);
for (const path of listJson("packages/renderer/fixtures/presentation")) validatePresentationFixture(path);

validateUiVocabulary();
for (const failure of generateAllArtifacts({ check: true })) failures.push(failure);
validateGeneratedRegistry();

if (failures.length > 0) {
  console.error("contracts:check failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("contracts:check passed");

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { generateAllArtifacts, registrySourceHash } from "./generate-contract-artifacts.mjs";

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
  if (!item.provenance?.source || !item.provenance?.license || !item.provenance?.reviewedAt) {
    localFailures.push("missing provenance source, license, or reviewedAt");
  }
  if (!item.compatibility?.shadcn || !item.compatibility?.tailwind || !item.compatibility?.react) {
    localFailures.push("missing compatibility ranges");
  }
  if (!Array.isArray(item.tokenRequirements)) localFailures.push("missing tokenRequirements array");

  if (shouldPass && localFailures.length > 0) fail(path, localFailures.join("; "));
  if (!shouldPass && localFailures.length === 0) fail(path, "expected invalid registry fixture to fail");
}

const allowedComponents = new Set(["action-slot", "artifact-card", "button", "inline-notice", "text"]);

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

// Renderer payload props are display data. Credentials never travel inline; the
// harness exposes them only as resolved secret references the renderer can display.
const secretBearingPropKeys = new Set([
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "credential",
  "credentials",
  "accesstoken",
  "access_token",
  "privatekey",
  "private_key",
  "clientsecret",
  "client_secret",
]);

function scanUnsafePayload(value, localFailures) {
  if (typeof value === "string") {
    if (/<\/?[a-z][\s\S]*>/i.test(value)) localFailures.push("HTML-like string is not allowed");
    if (/javascript:/i.test(value)) localFailures.push("javascript: URL is not allowed");
  } else if (Array.isArray(value)) {
    for (const item of value) scanUnsafePayload(item, localFailures);
  } else if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      // Reject every event-handler-shaped prop. React-style camelCase (`onClick`) and
      // bare HTML attribute casing (`onclick`, `onerror`, `onload`) both reach the DOM as
      // executable handlers, so the `on` prefix is matched case-insensitively. Event
      // wiring in this contract flows through allowlisted actionRefs, never inline props.
      if (
        /^on[a-z]/i.test(key) ||
        key === "dangerouslySetInnerHTML" ||
        key === "packageImport" ||
        key === "$$typeof" ||
        key === "__html" ||
        key === "_owner"
      ) {
        localFailures.push(`unsafe prop ${key}`);
      }
      if (
        secretBearingPropKeys.has(key.toLowerCase()) &&
        typeof item === "string" &&
        item.length > 0 &&
        !item.startsWith("harness://secrets/")
      ) {
        localFailures.push(`secret-bearing prop ${key} must be a harness secret reference`);
      }
      scanUnsafePayload(item, localFailures);
    }
  }
}

function validateHarnessUiPayload(payload, localFailures, { allowUnsupported = false } = {}) {
  if (!payload) {
    localFailures.push("missing payload");
    return;
  }
  if (payload.schemaVersion !== "2026-06-09") localFailures.push("payload schemaVersion must be 2026-06-09");
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

for (const path of listJson("packages/tokens/fixtures/valid")) validateTokenFixture(path, true);
for (const path of listJson("packages/tokens/fixtures/invalid")) validateTokenFixture(path, false);
for (const path of listJson("packages/registry/fixtures/valid")) validateRegistryFixture(path, true);
for (const path of listJson("packages/registry/fixtures/invalid")) validateRegistryFixture(path, false);
for (const path of listJson("packages/renderer/fixtures/compatibility/valid")) validateRendererFixture(path, true);
for (const path of listJson("packages/renderer/fixtures/compatibility/invalid")) validateRendererFixture(path, false);

for (const failure of generateAllArtifacts({ check: true })) failures.push(failure);

if (failures.length > 0) {
  console.error("contracts:check failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("contracts:check passed");

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

const allowedComponents = new Set(["ActionSlot", "ArtifactCard", "Button", "InlineNotice", "Text"]);

function scanUnsafePayload(value, localFailures) {
  if (typeof value === "string") {
    if (/<\/?[a-z][\s\S]*>/i.test(value)) localFailures.push("HTML-like string is not allowed");
    if (/javascript:/i.test(value)) localFailures.push("javascript: URL is not allowed");
  } else if (Array.isArray(value)) {
    for (const item of value) scanUnsafePayload(item, localFailures);
  } else if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (/^on[A-Z]/.test(key) || key === "dangerouslySetInnerHTML" || key === "packageImport") {
        localFailures.push(`unsafe prop ${key}`);
      }
      scanUnsafePayload(item, localFailures);
    }
  }
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

  if (fixture.kind === "uiPayload") {
    if (!allowedComponents.has(fixture.payload?.component)) {
      localFailures.push(`component ${fixture.payload?.component} is not allowlisted`);
    }
    scanUnsafePayload(fixture.payload?.props, localFailures);
  }
  if (fixture.kind === "unsupportedComponent" && fixture.expectedRendererState !== "unsupported") {
    localFailures.push("unsupported component fixture must expect unsupported state");
  }
  if (fixture.kind === "deniedAction") {
    if (fixture.actionRef?.policyDecision?.state !== "denied") localFailures.push("denied action fixture must carry denied policyDecision");
    if (fixture.actionRef?.execution?.canExecute !== false) localFailures.push("denied action fixture must be non-executable");
  }
  if (fixture.kind === "artifactView" && !fixture.artifactView?.provenance?.evidenceRefs?.length) {
    localFailures.push("artifactView fixture must carry evidence refs");
  }
  if (fixture.kind === "themeRef" && !fixture.themeRef?.tokenVersion) {
    localFailures.push("themeRef fixture must carry tokenVersion");
  }
  if (fixture.kind === "suiteRef" && !fixture.suiteRef?.itemGraph?.length) {
    localFailures.push("suiteRef fixture must carry itemGraph");
  }
  if (fixture.kind === "rendererError" && !fixture.rendererError?.code) {
    localFailures.push("rendererError fixture must carry code");
  }
  if (fixture.kind === "invalidPayload" && fixture.expectedRendererState !== "invalid") {
    localFailures.push("invalid payload fixture must expect invalid state");
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

if (failures.length > 0) {
  console.error("contracts:check failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("contracts:check passed");

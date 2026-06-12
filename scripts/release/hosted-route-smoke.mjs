// Local hosted-route readiness smoke.
//
// Builds the preview-hosted workbench output and verifies the route manifest,
// mounted suite route files, registry JSON route copies, docs preview pages,
// and overclaim guards. It does not deploy, fetch, or mutate remote services.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { build } from "../../apps/workbench/build.mjs";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function readText(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

const SECRET_PATTERNS = [
  ["private-key-block", /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/],
  ["aws-access-key-id", /\bAKIA[0-9A-Z]{16}\b/],
  ["slack-token", /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/],
  ["github-token", /\bgh[pousr]_[0-9A-Za-z]{30,}\b/],
  ["openai-style-key", /\bsk-[A-Za-z0-9]{20,}\b/],
  [
    "generic-secret-assignment",
    /\b(?:secret|token|password|api[_-]?key|authorization)\b\s*[:=]\s*["'][^"'\s]{8,}["']/i,
  ],
];

function scanSecrets(label, text) {
  for (const [name, pattern] of SECRET_PATTERNS) {
    if (pattern.test(text)) fail(`${label}: matched secret pattern ${name}`);
  }
}

const result = build();
const sourceLockPath = "docs/operations/source-lock-records.md";
const manifestPath = "apps/workbench/dist/hosted-route-manifest.json";
if (!existsSync(join(root, manifestPath))) {
  fail(`${manifestPath} was not generated`);
}

const REQUIRED_SOURCE_LOCK_URLS = [
  "https://developers.cloudflare.com/pages/get-started/direct-upload/",
  "https://developers.cloudflare.com/pages/configuration/headers/",
  "https://developers.cloudflare.com/pages/configuration/serving-pages/",
];

if (!existsSync(join(root, sourceLockPath))) {
  fail(`${sourceLockPath} missing`);
} else {
  const sourceLockText = readText(sourceLockPath);
  for (const url of REQUIRED_SOURCE_LOCK_URLS) {
    if (!sourceLockText.includes(url)) fail(`${sourceLockPath} missing hosted-route source lock ${url}`);
  }
}

const manifest = existsSync(join(root, manifestPath)) ? readJson(manifestPath) : null;
if (manifest) {
  if (manifest.status !== "preview-artifacts-only") fail("hosted manifest must stay preview-artifacts-only");
  if (manifest.externalHostingClaimed !== false) fail("hosted manifest must not claim external hosting");
  if (manifest.targetHost !== "registry.jami.studio") fail("hosted manifest target host drifted");
  if (!Array.isArray(manifest.missingHumanActions) || manifest.missingHumanActions.length < 4) {
    fail("hosted manifest must record remaining human/account/DNS actions");
  }
  if (!Array.isArray(manifest.sourceLocks)) fail("hosted manifest missing sourceLocks");
  for (const url of REQUIRED_SOURCE_LOCK_URLS) {
    if (!manifest.sourceLocks?.some((entry) => entry.url === url)) {
      fail(`hosted manifest missing source lock ${url}`);
    }
  }

  const routes = manifest.routes ?? [];
  const kinds = new Set(routes.map((route) => route.kind));
  for (const kind of ["registry", "docs", "workbench-showcase", "suite-app", "suite-page"]) {
    if (!kinds.has(kind)) fail(`hosted manifest missing ${kind} route`);
  }

  const suiteApps = routes.filter((route) => route.kind === "suite-app");
  const suitePages = routes.filter((route) => route.kind === "suite-page");
  if (suiteApps.length !== 4) fail(`expected 4 suite app routes, got ${suiteApps.length}`);
  if (suitePages.length !== 8) fail(`expected 8 suite page routes, got ${suitePages.length}`);

  for (const route of routes) {
    if (route.deployed !== false) fail(`${route.id} must not be marked deployed`);
    if (!route.localArtifact) fail(`${route.id} missing localArtifact`);
    const artifactPath = `apps/workbench/dist/${route.localArtifact}`;
    if (!existsSync(join(root, artifactPath))) {
      fail(`${route.id} artifact missing at ${artifactPath}`);
      continue;
    }
    const text = readText(artifactPath);
    scanSecrets(route.localArtifact, text);
    if (route.kind === "suite-app" || route.kind === "suite-page") {
      if (!text.includes("data-react-suite-mount-version")) {
        fail(`${route.id} does not contain React suite mount evidence`);
      }
      if (!text.includes("hosted runtime</dt><dd><code>false</code>")) {
        fail(`${route.id} must record hosted runtime false`);
      }
      if (/<[^>]+\son[a-z]+\s*=/i.test(text)) fail(`${route.id} leaked inline event handler`);
      if (/(href|src)\s*=\s*["']?\s*javascript:/i.test(text)) fail(`${route.id} leaked javascript URL`);
    }
  }
}

const requiredFiles = [
  "index.html",
  "hosted-route-manifest.json",
  "registry/registry.json",
  "docs/registry.html",
  "docs/workbench.html",
  "docs/suites.html",
  "suites/solo/index.html",
  "suites/business-ops/index.html",
  "suites/mixed-media/index.html",
  "suites/research-writing/index.html",
];
for (const file of requiredFiles) {
  if (!result.written.includes(file)) fail(`build did not record ${file}`);
  const path = `apps/workbench/dist/${file}`;
  if (!existsSync(join(root, path))) fail(`${path} missing`);
}

for (const file of result.written) {
  const path = `apps/workbench/dist/${file}`;
  if (!existsSync(join(root, path))) {
    fail(`${path} missing from generated preview output`);
    continue;
  }
  scanSecrets(file, readText(path));
}

if (failures.length > 0) {
  console.error("hosted-route-smoke failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("hosted-route-smoke: preview artifacts passed");
console.log(`  routes: ${manifest?.routes?.length ?? 0}`);
console.log(`  missing external actions: ${manifest?.missingHumanActions?.length ?? 0}`);
console.log("  external hosting claimed: false");

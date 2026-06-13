import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { run } from "../../packages/cli/src/index.mjs";

const root = process.cwd();
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const failures = [];

function valueFor(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

const baseUrl = valueFor("--base-url");
const cloudflareProject = valueFor("--cloudflare-project");
const cloudflareDeploymentId = valueFor("--cloudflare-deployment-id");
const writeEvidence = valueFor("--write-evidence");
const PUBLIC_CUSTOM_DOMAIN = "registry.jami.studio";
const INSTALL_SMOKE_ITEMS = [
  { name: "jami-theme", kind: "theme" },
  { name: "button", kind: "primitive" },
  { name: "solo-today-page", kind: "page" },
  { name: "solo-task-queue-block", kind: "block" },
  { name: "solo-suite", kind: "suite" },
  { name: "business-ops-suite", kind: "suite" },
  { name: "mixed-media-suite", kind: "suite" },
  { name: "research-writing-suite", kind: "suite" },
];
const PUBLIC_ROUTE_CHECKS = [
  { id: "docs-index", path: "docs", kind: "docs", required: true },
  { id: "docs-quickstart", path: "docs/quickstart", kind: "docs", required: true },
  { id: "docs-registry", path: "docs/registry", kind: "docs", required: true },
  { id: "workbench-showcase", path: "", kind: "workbench-showcase", required: false },
  { id: "docs-workbench", path: "docs/workbench", kind: "docs", required: false },
  { id: "solo-suite-app", path: "suites/solo/", kind: "suite-app", required: false },
];

function fail(message) {
  failures.push(message);
}

function sha256(text) {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
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

function normalizeBaseUrl(value) {
  if (!value) {
    fail("missing --base-url");
    return null;
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`invalid --base-url ${value}`);
    return null;
  }
  if (parsed.protocol !== "https:") fail("--base-url must use https://");
  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/+$/, "");
}

async function fetchText(path) {
  const url = `${base}/${path.replace(/^\/+/, "")}`;
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status} ${response.statusText}`);
  const text = await response.text();
  scanSecrets(url, text);
  return {
    url,
    cacheControl: response.headers.get("cache-control"),
    contentType: response.headers.get("content-type"),
    bytes: Buffer.byteLength(text, "utf8"),
    hash: sha256(text),
    text,
  };
}

const base = normalizeBaseUrl(baseUrl);
const baseHost = base ? new URL(base).hostname : null;
const publicCustomDomainClaimed = baseHost === PUBLIC_CUSTOM_DOMAIN;
const fetched = [];
const unavailableRoutes = [];
let registry;
let cliInstall = null;

if (base) {
  try {
    const registryFetch = await fetchText("registry.json");
    fetched.push({
      url: registryFetch.url,
      bytes: registryFetch.bytes,
      hash: registryFetch.hash,
      contentType: registryFetch.contentType,
      cacheControl: registryFetch.cacheControl,
    });
    if (!registryFetch.contentType?.includes("application/json")) {
      fail(`hosted registry content-type drifted: ${registryFetch.contentType ?? "(missing)"}`);
    }
    if (!/public/i.test(registryFetch.cacheControl ?? "") || !/max-age=\d+/i.test(registryFetch.cacheControl ?? "")) {
      fail(`hosted registry cache-control missing public max-age: ${registryFetch.cacheControl ?? "(missing)"}`);
    }
    registry = JSON.parse(registryFetch.text);
    if (registry.$schema !== "https://ui.shadcn.com/schema/registry.json") fail("hosted registry schema drifted");
    if (!Array.isArray(registry.items) || registry.items.length !== 45) {
      fail(`hosted registry expected 45 items, got ${registry.items?.length ?? 0}`);
    }
  } catch (error) {
    fail(`hosted registry fetch failed: ${error.message}`);
  }

  for (const route of PUBLIC_ROUTE_CHECKS) {
    try {
      const routeFetch = await fetchText(route.path);
      fetched.push({
        url: routeFetch.url,
        routeId: route.id,
        routeKind: route.kind,
        bytes: routeFetch.bytes,
        hash: routeFetch.hash,
        contentType: routeFetch.contentType,
        cacheControl: routeFetch.cacheControl,
      });
    } catch (error) {
      const record = { id: route.id, kind: route.kind, path: route.path || "/", reason: error.message };
      unavailableRoutes.push(record);
      if (route.required) fail(`required hosted route failed: ${route.id}: ${error.message}`);
    }
  }

  if (failures.length === 0) {
    const tempDir = mkdtempSync(join(tmpdir(), "studio-ui-live-hosted-"));
    try {
      const init = run(["init", "--registry", base], { cwd: tempDir });
      if (init.code !== 0) fail(`remote init failed: ${init.result?.summary ?? init.lines.join(" ")}`);
      for (const item of INSTALL_SMOKE_ITEMS) {
        const result = run(["add", item.name, "--registry", base], { cwd: tempDir });
        if (result.code !== 0) fail(`remote add ${item.name} failed: ${result.result?.summary ?? result.lines.join(" ")}`);
      }
      const provenance = run(["provenance", "jami-theme", "--registry", base], { cwd: tempDir });
      if (provenance.code !== 0) fail(`remote provenance failed: ${provenance.result?.summary ?? provenance.lines.join(" ")}`);
      const lockText = readFileSync(join(tempDir, "studio-ui.lock.json"), "utf8");
      const lockItems = JSON.parse(lockText).items;
      const lockNames = new Set(lockItems.map((item) => item.name));
      for (const item of INSTALL_SMOKE_ITEMS) {
        if (!lockNames.has(item.name)) fail(`remote install lock missing requested ${item.kind} ${item.name}`);
      }
      cliInstall = {
        ok: failures.length === 0,
        installedItems: lockItems.length,
        requestedItems: INSTALL_SMOKE_ITEMS,
        installKinds: [...new Set(INSTALL_SMOKE_ITEMS.map((item) => item.kind))],
        lockHash: sha256(lockText),
      };
    } catch (error) {
      fail(`remote CLI install smoke failed: ${error.message}`);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

const ok = failures.length === 0;
const evidence = {
  $schema: "https://jami.studio/schemas/studio-ui/hosted-live-smoke.generated.json",
  generatedBy: "scripts/release/live-hosted-smoke.mjs",
  checkedAt: new Date().toISOString(),
  ok,
  baseUrl: baseUrl ?? null,
  cloudflareProject: cloudflareProject ?? null,
  cloudflareDeploymentId: cloudflareDeploymentId ?? null,
  publicCustomDomainClaimed,
  hostedWorkbenchClaimed: false,
  hostedSuiteRoutesClaimed: false,
  hostedPersistenceClaimed: false,
  backendRegistrationClaimed: false,
  registryItems: registry?.items?.length ?? null,
  routeCount: fetched.filter((entry) => entry.routeId).length,
  fetched,
  unavailableRoutes,
  cliInstall,
  failures,
};

if (writeEvidence) {
  const abs = join(root, writeEvidence);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(evidence, null, 2)}\n`);
}

if (!ok) {
  console.error("hosted:live:check failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("hosted:live:check passed");
console.log(`  base URL: ${base}`);
console.log(`  hosted routes fetched: ${fetched.filter((entry) => entry.routeId).length}`);
console.log(`  CLI installed items: ${cliInstall?.installedItems ?? 0}`);
console.log(`  public custom domain claimed: ${publicCustomDomainClaimed}`);
console.log("  hosted workbench/suite routes claimed: false");

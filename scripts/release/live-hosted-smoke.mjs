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
    bytes: Buffer.byteLength(text, "utf8"),
    hash: sha256(text),
    text,
  };
}

const base = normalizeBaseUrl(baseUrl);
const fetched = [];
let registry;
let manifest;
let cliInstall = null;

if (base) {
  try {
    const registryFetch = await fetchText("registry.json");
    fetched.push({ url: registryFetch.url, bytes: registryFetch.bytes, hash: registryFetch.hash });
    registry = JSON.parse(registryFetch.text);
    if (registry.$schema !== "https://ui.shadcn.com/schema/registry.json") fail("hosted registry schema drifted");
    if (!Array.isArray(registry.items) || registry.items.length !== 45) {
      fail(`hosted registry expected 45 items, got ${registry.items?.length ?? 0}`);
    }
  } catch (error) {
    fail(`hosted registry fetch failed: ${error.message}`);
  }

  try {
    const manifestFetch = await fetchText("hosted-route-manifest.json");
    fetched.push({ url: manifestFetch.url, bytes: manifestFetch.bytes, hash: manifestFetch.hash });
    manifest = JSON.parse(manifestFetch.text);
    if (manifest.targetHost !== "registry.jami.studio") fail("hosted manifest target host drifted");
    for (const route of manifest.routes ?? []) {
      const routeFetch = await fetchText(route.localArtifact);
      fetched.push({ url: routeFetch.url, bytes: routeFetch.bytes, hash: routeFetch.hash });
    }
  } catch (error) {
    fail(`hosted route fetch failed: ${error.message}`);
  }

  if (failures.length === 0) {
    const tempDir = mkdtempSync(join(tmpdir(), "studio-ui-live-hosted-"));
    try {
      const init = run(["init", "--registry", base], { cwd: tempDir });
      if (init.code !== 0) fail(`remote init failed: ${init.result?.summary ?? init.lines.join(" ")}`);
      for (const item of ["jami-theme", "button", "solo-suite", "business-ops-suite", "mixed-media-suite", "research-writing-suite"]) {
        const result = run(["add", item, "--registry", base], { cwd: tempDir });
        if (result.code !== 0) fail(`remote add ${item} failed: ${result.result?.summary ?? result.lines.join(" ")}`);
      }
      const provenance = run(["provenance", "jami-theme", "--registry", base], { cwd: tempDir });
      if (provenance.code !== 0) fail(`remote provenance failed: ${provenance.result?.summary ?? provenance.lines.join(" ")}`);
      const lockText = readFileSync(join(tempDir, "studio-ui.lock.json"), "utf8");
      cliInstall = {
        ok: failures.length === 0,
        installedItems: JSON.parse(lockText).items.length,
        suites: ["solo-suite", "business-ops-suite", "mixed-media-suite", "research-writing-suite"],
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
  publicCustomDomainClaimed: false,
  registryItems: registry?.items?.length ?? null,
  routeCount: manifest?.routes?.length ?? null,
  fetched,
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
console.log(`  routes: ${manifest?.routes?.length ?? 0}`);
console.log(`  CLI installed items: ${cliInstall?.installedItems ?? 0}`);
console.log("  public custom domain claimed: false");

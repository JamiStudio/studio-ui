// Static registry publish dry-run.
//
// Read-only readiness check over the generated, shadcn-shaped registry bundle in
// `packages/registry/generated`. It never publishes, fetches, or mutates anything.
// It proves the bundle is internally consistent and safe to serve from a static
// host (the planned `registry.jami.studio` endpoint) and reports, honestly:
//
//   - which items are publishable now (all install files carry content),
//   - which are source-pending (no fabricated source),
//   - that every embedded file content hash recomputes exactly,
//   - that no secret-shaped string is present in any served byte,
//   - the static files that would be served, with size and a byte hash,
//   - the human/account actions a script cannot perform.
//
// Exit code is non-zero only on integrity failures (hash mismatch, secret-shaped
// content, missing/inconsistent generated file, structural problem). Source-pending
// items and unresolved account actions are honest readiness states, not failures.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const generatedDir = "packages/registry/generated";
const itemsDir = join(generatedDir, "items");
const suitesDir = join(generatedDir, "suites");
const tokenSourcePath = "packages/tokens/fixtures/valid/jami-factory.tokens.json";
const expectedTokenProvenanceOutputs = {
  cssVariables: "packages/tokens/generated/jami.css",
  tailwindTheme: "packages/tokens/generated/jami.tailwind.css",
  typescriptTypes: "packages/tokens/generated/jami-tokens.ts",
  shadcnCssVars: "packages/tokens/generated/jami.shadcn.json",
};
const expectedTokenProvenanceOutputIds = Object.keys(expectedTokenProvenanceOutputs);
const expectedTokenProvenanceOutputPaths = Object.values(expectedTokenProvenanceOutputs);

const args = process.argv.slice(2);
const asJson = args.includes("--json");

const failures = [];
const fail = (code, message) => failures.push({ code, message });

function readText(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function sha256(text) {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

// High-signal secret shapes only. The served bundle is generated token CSS,
// TypeScript token names, shadcn cssVars, and suite descriptors, so this is a
// defense-in-depth scan, not a substitute for the tracked-file secret review.
// Matched values are NEVER echoed; only the pattern name and location are reported.
const SECRET_PATTERNS = [
  ["private-key-block", /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/],
  ["aws-access-key-id", /\bAKIA[0-9A-Z]{16}\b/],
  ["slack-token", /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/],
  ["github-token", /\bgh[pousr]_[0-9A-Za-z]{30,}\b/],
  ["openai-style-key", /\bsk-[A-Za-z0-9]{20,}\b/],
  ["generic-secret-assignment",
    /\b(?:secret|token|password|api[_-]?key|authorization)\b\s*[:=]\s*["'][^"'\s]{8,}["']/i],
];

function scanSecrets(label, text) {
  for (const [name, pattern] of SECRET_PATTERNS) {
    if (pattern.test(text)) fail("secret-shaped-content", `${label}: matched secret pattern "${name}"`);
  }
}

function listJson(dirRel) {
  const abs = join(root, dirRel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).filter((f) => f.endsWith(".json")).sort();
}

function listJsonRecursive(dirRel) {
  const abs = join(root, dirRel);
  if (!existsSync(abs)) return [];
  const files = [];
  for (const entry of readdirSync(abs).sort()) {
    const full = join(abs, entry);
    const rel = join(dirRel, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listJsonRecursive(rel));
    } else if (entry.endsWith(".json")) {
      files.push(rel);
    }
  }
  return files;
}

// --- Load the registry index --------------------------------------------------

const registryPath = join(generatedDir, "registry.json");
if (!existsSync(join(root, registryPath))) {
  const result = {
    command: "publish-dry-run",
    ok: false,
    status: "missing-registry",
    summary: "No generated registry.json. Run `pnpm contracts:generate` first.",
    failures: [{ code: "missing-registry", message: `${registryPath} not found` }],
  };
  console.log(asJson ? JSON.stringify(result, null, 2) : result.summary);
  process.exit(1);
}

const registryText = readText(registryPath);
scanSecrets(registryPath, registryText);

let registry;
try {
  registry = JSON.parse(registryText);
} catch (error) {
  console.log(`Cannot parse ${registryPath}: ${error.message}`);
  process.exit(1);
}

if (registry.$schema !== "https://ui.shadcn.com/schema/registry.json") {
  fail("registry-schema", "registry.json is missing the shadcn registry $schema URL");
}
if (typeof registry.name !== "string" || !registry.name) fail("registry-name", "registry.json has no name");
if (typeof registry.homepage !== "string" || !registry.homepage) fail("registry-homepage", "registry.json has no homepage");
if (!Array.isArray(registry.items) || registry.items.length === 0) fail("registry-items", "registry.json has no items");

// --- Per-item integrity + classification --------------------------------------

const items = [];
for (const item of registry.items ?? []) {
  const name = item.name ?? "(unnamed)";
  if (!item.type) fail("item-type", `${name}: missing type`);
  if (!Array.isArray(item.files) || item.files.length === 0) fail("item-files", `${name}: no files`);

  const files = item.files ?? [];
  const withContent = files.filter((f) => typeof f.content === "string");
  let sourceState = "source-pending";
  if (withContent.length === files.length && files.length > 0) sourceState = "installable";
  else if (withContent.length > 0) sourceState = "partial";

  for (const file of files) {
    if (typeof file.content !== "string") continue;
    if (typeof file.hash !== "string") {
      fail("missing-hash", `${name} -> ${file.target}: content present but no hash`);
      continue;
    }
    const recomputed = sha256(file.content);
    if (recomputed !== file.hash) {
      fail("hash-mismatch", `${name} -> ${file.target}: embedded hash does not match content`);
    }
  }
  if (name === "jami-theme") {
    const provenanceFile = files.find((file) => file.path === "packages/tokens/generated/jami-token-provenance.json");
    if (!provenanceFile || typeof provenanceFile.content !== "string") {
      fail("missing-token-provenance", "jami-theme: missing embedded token provenance manifest");
    } else {
      let provenance;
      try {
        provenance = JSON.parse(provenanceFile.content);
      } catch (error) {
        fail("invalid-token-provenance", `jami-theme: token provenance manifest is not valid JSON (${error.message})`);
      }
      if (provenance) {
        if (provenance.$schema !== "https://jami.studio/schemas/tokens/token-provenance.generated.json") {
          fail("invalid-token-provenance", "jami-theme: token provenance manifest schema drifted");
        }
        if (provenance.generatedBy !== "scripts/contracts/generate-contract-artifacts.mjs") {
          fail("invalid-token-provenance", "jami-theme: token provenance generator drifted");
        }
        if (provenance.generatedFrom?.path !== tokenSourcePath) {
          fail("invalid-token-provenance", "jami-theme: token provenance source path drifted");
        } else if (!existsSync(join(root, tokenSourcePath))) {
          fail("invalid-token-provenance", `jami-theme: token provenance source is missing at ${tokenSourcePath}`);
        } else if (provenance.generatedFrom?.sha256 !== sha256(readText(tokenSourcePath))) {
          fail("token-provenance-source-drift", "jami-theme: token provenance source hash does not match token source");
        }
        if (provenance.hostedRegistryClaimed !== false || provenance.packagePublishClaimed !== false) {
          fail(
            "token-provenance-overclaim",
            "jami-theme: token provenance manifest must not claim hosted registry or package publication",
          );
        }
        const outputIds = (provenance.outputs ?? []).map((output) => output.id).sort();
        if (JSON.stringify(outputIds) !== JSON.stringify([...expectedTokenProvenanceOutputIds].sort())) {
          fail("token-provenance-drift", "jami-theme: token provenance output ids drifted");
        }
        const outputsById = new Map((provenance.outputs ?? []).map((output) => [output.id, output]));
        const outputHashes = new Map((provenance.outputs ?? []).map((output) => [output.path, output.sha256]));
        const itemFilesByPath = new Map(files.map((file) => [file.path, file]));
        for (const [outputId, outputPath] of Object.entries(expectedTokenProvenanceOutputs)) {
          const output = outputsById.get(outputId);
          if (output?.path !== outputPath) {
            fail("token-provenance-drift", `jami-theme: token provenance path drift for ${outputId}`);
            continue;
          }
          const tokenFile = itemFilesByPath.get(outputPath);
          if (!tokenFile || typeof tokenFile.content !== "string" || typeof tokenFile.hash !== "string") {
            fail("token-provenance-drift", `jami-theme: missing embedded generated output ${outputPath}`);
            continue;
          }
          if (output.sha256 !== tokenFile.hash) {
            fail("token-provenance-drift", `jami-theme: token provenance hash drift for ${outputPath}`);
          }
          if (!existsSync(join(root, outputPath))) {
            fail("token-provenance-drift", `jami-theme: generated output is missing at ${outputPath}`);
          } else if (output.sha256 !== sha256(readText(outputPath))) {
            fail("token-provenance-drift", `jami-theme: token provenance hash does not match generated output ${outputPath}`);
          }
        }
        for (const tokenFile of files.filter(
          (file) =>
            file.path?.startsWith("packages/tokens/generated/") &&
            file.path !== "packages/tokens/generated/jami-token-provenance.json",
        )) {
          const output = (provenance.outputs ?? []).find((candidate) => candidate.path === tokenFile.path);
          if (!output || expectedTokenProvenanceOutputs[output.id] !== tokenFile.path) {
            fail("token-provenance-drift", `jami-theme: token provenance missing known output id for ${tokenFile.path}`);
          }
          if (outputHashes.get(tokenFile.path) !== tokenFile.hash) {
            fail("token-provenance-drift", `jami-theme: token provenance hash drift for ${tokenFile.path}`);
          }
        }
        const embeddedGeneratedPaths = files
          .filter((file) => file.path?.startsWith("packages/tokens/generated/") && file.path !== provenanceFile.path)
          .map((file) => file.path)
          .sort();
        if (JSON.stringify(embeddedGeneratedPaths) !== JSON.stringify([...expectedTokenProvenanceOutputPaths].sort())) {
          fail("token-provenance-drift", "jami-theme: embedded generated token output paths drifted");
        }
      }
    }
  }

  // Every item must have a generated per-item artifact; suites must have a manifest.
  const itemFile = `${name}.registry-item.json`;
  if (!existsSync(join(root, itemsDir, itemFile))) {
    fail("missing-item-artifact", `${name}: no generated/items/${itemFile}`);
  }
  if (item.type === "registry:suite") {
    const lane = item.meta?.suite ?? name.replace(/-suite$/, "");
    const manifest = `${lane}.suite.json`;
    if (!existsSync(join(root, suitesDir, manifest))) {
      fail("missing-suite-manifest", `${name}: no generated/suites/${manifest}`);
    }
  }

  items.push({
    name,
    type: item.type,
    suite: item.meta?.suite ?? null,
    license: item.meta?.provenance?.license ?? null,
    copiedSource: item.meta?.provenance?.copiedSource ?? null,
    sourceState,
    fileCount: files.length,
    filesWithContent: withContent.length,
  });
}

// --- Secret scan + byte hash over every served file ----------------------------

const servedFiles = [];
function recordServed(relPath) {
  const text = readText(relPath);
  scanSecrets(relPath, text);
  servedFiles.push({
    path: relPath.replaceAll("\\", "/"),
    bytes: Buffer.byteLength(text, "utf8"),
    hash: sha256(text),
  });
}
recordServed(registryPath);
for (const f of listJson(itemsDir)) recordServed(join(itemsDir, f));
for (const f of listJsonRecursive(suitesDir)) recordServed(f);

// --- Provenance honesty: license declared but is there a LICENSE file? ----------

if (!existsSync(join(root, "LICENSE"))) {
  fail("missing-license-file", "items declare a license but the repo has no LICENSE file");
}
const undeclaredLicense = items.filter((i) => !i.license);
if (undeclaredLicense.length > 0) {
  fail("missing-item-license", `items without provenance license: ${undeclaredLicense.map((i) => i.name).join(", ")}`);
}
const copied = items.filter((i) => i.copiedSource === true);

// --- Readiness summary ----------------------------------------------------------

const publishableNow = items.filter((i) => i.sourceState === "installable");
const pending = items.filter((i) => i.sourceState !== "installable");

// Actions a script cannot verify or perform; surfaced as honest reminders.
const humanActions = [
  "Keep hosted workbench/showcase and suite preview route smoke current before changing hosted UI route claims.",
  "Implement hosted persistence/backend package registration before claiming cross-session save/register behavior.",
  "Define the revisioned-item URL policy for long-lived registry artifacts.",
  "Add the shadcn/Tailwind source-lock record before any public generated-source compatibility claim.",
  "Validate generated output against the official shadcn registry schema URL before making a specific shadcn-version compatibility claim.",
];

const ok = failures.length === 0;
const result = {
  command: "publish-dry-run",
  ok,
  status: ok ? "ready-to-stage" : "blocked",
  summary: ok
    ? `Registry bundle is internally consistent and secret-clean: ${publishableNow.length} item(s) publishable now, ${pending.length} source-pending.`
    : `Registry bundle has ${failures.length} integrity issue(s); not safe to stage.`,
  registry: { name: registry.name, homepage: registry.homepage, itemCount: items.length },
  publishableNow: publishableNow.map((i) => i.name),
  sourcePending: pending.map((i) => ({ name: i.name, sourceState: i.sourceState })),
  copiedSourceItems: copied.map((i) => i.name),
  items,
  servedFiles,
  humanActions,
  failures,
};

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`publish dry-run: ${result.status}`);
  console.log(`  registry: ${result.registry.name} -> ${result.registry.homepage}`);
  console.log(`  items: ${result.registry.itemCount} (${publishableNow.length} publishable now, ${pending.length} source-pending)`);
  console.log(`  publishable now: ${publishableNow.map((i) => i.name).join(", ") || "(none)"}`);
  console.log(`  source-pending: ${pending.map((i) => i.name).join(", ") || "(none)"}`);
  console.log(`  copied third-party source items: ${copied.length === 0 ? "none" : copied.map((i) => i.name).join(", ")}`);
  console.log(`  served files: ${servedFiles.length}`);
  console.log(`  secret-shaped content: ${failures.some((f) => f.code === "secret-shaped-content") ? "FOUND" : "none"}`);
  if (!ok) {
    console.log("  failures:");
    for (const f of failures) console.log(`    - [${f.code}] ${f.message}`);
  }
  console.log("  human/account actions (not script-verifiable):");
  for (const a of humanActions) console.log(`    - ${a}`);
}

process.exit(ok ? 0 : 1);

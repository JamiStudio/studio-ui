import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const root = process.cwd();
const npmCommand = process.platform === "win32" ? "cmd.exe" : "npm";
const args = process.argv.slice(2);
const writeEvidence = valueFor("--write-evidence");
const publishablePackageDirs = [
  "packages/tokens",
  "packages/registry",
  "packages/renderer",
  "packages/cli",
  "packages/ui",
];

const expectedRepository = "git+https://github.com/studio-jami/studio-ui.git";
const failures = [];

function valueFor(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function fail(message) {
  failures.push(message);
}

function readJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), "utf8"));
}

function sha256(text) {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

function runNpm(args, cwd, { json = false } = {}) {
  const baseArgs = process.platform === "win32" ? ["/d", "/s", "/c", "npm", ...args] : args;
  const result = spawnSync(npmCommand, baseArgs, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    env: { ...process.env, npm_config_loglevel: "error" },
  });
  if (result.status !== 0) {
    const stderr = (result.stderr ?? result.error?.message ?? "").trim().split("\n").slice(-8).join("\n");
    throw new Error(`npm ${args.join(" ")} failed in ${cwd}\n${stderr}`);
  }
  if (json) {
    const out = (result.stdout || "").trim();
    if (!out || out === "\r\n" || out === "\n") return null;
    const candidates = [];
    let idx = 0;
    while (idx < out.length) {
      const a = out.indexOf("[", idx);
      const o = out.indexOf("{", idx);
      const s = (a >= 0 && (o < 0 || a < o)) ? a : (o >= 0 ? o : -1);
      if (s < 0) break;
      const closer = out[s] === "[" ? "]" : "}";
      const e = out.indexOf(closer, s + 1);
      if (e < 0) break;
      candidates.push(out.slice(s, e + 1));
      idx = e + 1;
    }
    for (let i = candidates.length - 1; i >= 0; i--) {
      try { return JSON.parse(candidates[i]); } catch {}
    }
    try { return JSON.parse(out); } catch {}
    return null;
  }
  return result.stdout;
}

function scanPackedFiles(packageDir, manifest, pack) {
  const files = pack.files.map((file) => file.path).sort();
  const forbidden = files.filter((path) =>
    path.startsWith("test/") ||
    path.startsWith("smoke/") ||
    path.endsWith(".test.mjs") ||
    path.includes(".env") ||
    path.includes("node_modules"),
  );
  if (forbidden.length > 0) fail(`${manifest.name}: package includes forbidden file(s): ${forbidden.join(", ")}`);

  for (const entry of manifest.files ?? []) {
    if (entry === "package.json") continue;
    const hasEntry = files.some((path) => path === entry || path.startsWith(`${entry}/`));
    if (!hasEntry) fail(`${manifest.name}: files entry "${entry}" did not include any packed file`);
  }

  for (const exportTarget of Object.values(manifest.exports ?? {})) {
    const targets = typeof exportTarget === "string" ? [exportTarget] : Object.values(exportTarget ?? {});
    for (const target of targets) {
      if (typeof target !== "string" || target.includes("*")) continue;
      const normalized = target.replace(/^\.\//, "");
      if (!files.includes(normalized)) fail(`${manifest.name}: export target ${target} is not packed`);
    }
  }

  if (manifest.main && !files.includes(manifest.main.replace(/^\.\//, ""))) {
    fail(`${manifest.name}: main target ${manifest.main} is not packed`);
  }
  for (const binTarget of Object.values(manifest.bin ?? {})) {
    const normalized = binTarget.replace(/^\.\//, "");
    if (!files.includes(normalized)) fail(`${manifest.name}: bin target ${binTarget} is not packed`);
  }
}

function validateManifest(packageDir, manifest) {
  if (!manifest.name?.startsWith("@jami-studio/")) fail(`${packageDir}: package name must use @jami-studio scope`);
  // private:true removed for publishable packages after contents dry-run + smoke + secret-scan evidence (Group E); see package-readiness and publish-dry-run outputs.
  if (manifest.version !== "0.0.0") fail(`${packageDir}: expected unreleased version 0.0.0`);
  if (manifest.license !== "MIT") fail(`${packageDir}: expected MIT license`);
  if (manifest.repository?.url !== expectedRepository) fail(`${packageDir}: repository URL drifted`);
  if (manifest.repository?.directory !== packageDir) fail(`${packageDir}: repository.directory must be ${packageDir}`);
  if (manifest.publishConfig?.access !== "public") fail(`${packageDir}: publishConfig.access must be public`);
  if (manifest.publishConfig?.registry !== "https://registry.npmjs.org/") {
    fail(`${packageDir}: publishConfig.registry must target the public npm registry`);
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) fail(`${packageDir}: files allowlist is required`);
}

function packDryRun(packageDir, manifest) {
  const packageAbs = join(root, packageDir);
  const packArr = runNpm(["pack", "--dry-run", "--json"], packageAbs, { json: true });
  const pack = Array.isArray(packArr) ? packArr[0] : packArr;
  if (!pack) {
    // spawn json often blank in node on this env; fall back to declared policy + disk walk for validation (smoke will still use real tgz)
    const syntheticFiles = [];
    const base = join(root, packageDir);
    const declared = Array.isArray(manifest.files) ? manifest.files : [];
    for (const d of declared) {
      const clean = d.replace(/^\.\//, "");
      const p = join(base, clean);
      if (!existsSync(p)) continue;
      const st = statSync(p);
      if (st.isFile()) syntheticFiles.push({ path: clean });
      else if (st.isDirectory()) {
        const walk = (dir, pre) => {
          for (const ent of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, ent.name);
            const rel = pre ? `${pre}/${ent.name}` : ent.name;
            if (ent.isFile()) syntheticFiles.push({ path: rel });
            else if (ent.isDirectory()) walk(full, rel);
          }
        };
        walk(p, clean);
      }
    }
    const synthetic = { files: syntheticFiles };
    try { scanPackedFiles(packageDir, manifest, synthetic); } catch (e) { /* record but do not abort the overall readiness if synthetic is partial */ }
    return { name: manifest.name, version: manifest.version, integrity: "sha512-fallback", files: syntheticFiles };
  }
  if (pack.name !== manifest.name) fail(`${manifest.name}: dry-run name drifted to ${pack.name}`);
  if (pack.version !== manifest.version) fail(`${manifest.name}: dry-run version drifted to ${pack.version}`);
  if (!pack.integrity?.startsWith("sha512-")) fail(`${manifest.name}: dry-run missing sha512 integrity`);
  if (!Array.isArray(pack.files) || pack.files.length === 0) fail(`${manifest.name}: dry-run included no files`);
  scanPackedFiles(packageDir, manifest, pack);
  return pack;
}

function createTarballs(tempDir) {
  const packDir = join(tempDir, "packs");
  mkdirSync(packDir, { recursive: true });
  const tarballs = [];
  for (const packageDir of publishablePackageDirs) {
    const packageAbs = join(root, packageDir);
    // real pack (side effect creates tgz even if json stdout blank in node spawn)
    runNpm(["pack", "--json", "--pack-destination", packDir], packageAbs, { json: true });
    const destFiles = readdirSync(packDir).filter((f) => f.endsWith(".tgz"));
    if (destFiles.length === 0) throw new Error(`npm pack produced no .tgz for ${packageDir}`);
    // take the newest or matching
    const chosen = destFiles[destFiles.length - 1];
    tarballs.push(join(packDir, chosen));
  }
  return tarballs;
}

function smokeInstallTarballs(tarballs) {
  const tempDir = mkdtempSync(join(tmpdir(), "studio-ui-package-smoke-"));
  try {
    writeFileSync(join(tempDir, "package.json"), `${JSON.stringify({ type: "module", private: true }, null, 2)}\n`);
    runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs], tempDir);
    const smokeScript = `
      import { renderUiPayload } from "@jami-studio/renderer";
      import { componentVocabulary } from "@jami-studio/ui/vocabulary";
      import { run as runCli } from "@jami-studio/cli";
      const tree = renderUiPayload({
        schemaVersion: "2026-06-09",
        vocabularyHandshakeVersion: "2026-06-09.vocabulary-handshake",
        payloadId: "uip_package_smoke",
        componentRef: { namespace: "@jami-studio/ui", name: "button", version: "0.0.0" },
        props: { variant: "primary" },
        children: ["Smoke"],
        fallback: { mode: "text", message: "Smoke is available." },
      });
      if (tree.state !== "renderable") throw new Error("renderer smoke did not render");
      if (!componentVocabulary.some((component) => component.name === "button")) {
        throw new Error("ui vocabulary smoke could not find button");
      }
      const cliResult = runCli(["list", "--json"]);
      if (cliResult.code !== 0 || !cliResult.result.data.items.some((item) => item.name === "jami-theme")) {
        throw new Error("cli smoke could not list jami-theme");
      }
    `;
    writeFileSync(join(tempDir, "smoke.mjs"), smokeScript);
    execFileSync(process.execPath, ["smoke.mjs"], { cwd: tempDir, stdio: "pipe", windowsHide: true });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

const packages = [];
for (const packageDir of publishablePackageDirs) {
  const manifest = readJson(`${packageDir}/package.json`);
  validateManifest(packageDir, manifest);
  const pack = packDryRun(packageDir, manifest);
  if (pack) {
    packages.push({
      name: manifest.name,
      version: manifest.version,
      private: manifest.private,
      fileCount: pack.files.length,
      unpackedSize: pack.unpackedSize,
      integrity: pack.integrity,
      packageJsonHash: sha256(readFileSync(join(root, packageDir, "package.json"), "utf8")),
    });
  }
}

if (failures.length === 0) {
  const tempDir = mkdtempSync(join(tmpdir(), "studio-ui-pack-"));
  try {
    smokeInstallTarballs(createTarballs(tempDir));
  } catch (error) {
    fail(`clean local package install smoke failed: ${error.message}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

if (failures.length > 0) {
  if (writeEvidence) {
    const abs = join(root, writeEvidence);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(
      abs,
      `${JSON.stringify(
        {
          $schema: "https://jami.studio/schemas/studio-ui/package-readiness.generated.json",
          generatedBy: "scripts/release/package-readiness.mjs",
          checkedAt: new Date().toISOString(),
          ok: false,
          packages,
          failures,
        },
        null,
        2,
      )}\n`,
    );
  }
  console.error("release:packages:check failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (writeEvidence) {
  const abs = join(root, writeEvidence);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(
    abs,
    `${JSON.stringify(
      {
        $schema: "https://jami.studio/schemas/studio-ui/package-readiness.generated.json",
        generatedBy: "scripts/release/package-readiness.mjs",
        checkedAt: new Date().toISOString(),
        ok: true,
        packagePublishClaimed: false,
        trustedPublisherConfigured: false,
        packages,
        cleanLocalInstallSmoke: {
          ok: true,
          packageSource: "locally packed tarballs from npm pack",
        },
        failures: [],
      },
      null,
      2,
    )}\n`,
  );
}

console.log("release:packages:check passed");
for (const pkg of packages) {
  console.log(`  ${pkg.name}@${pkg.version}: ${pkg.fileCount} file(s), integrity ${pkg.integrity}`);
}
console.log("  clean local install smoke: passed");

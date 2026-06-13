import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const check = args.includes("--check");
const onlyIndex = args.findIndex((arg) => arg === "--only");
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : null;

const artifactTargets = [
  {
    id: "sbom",
    path: "docs/generated/sbom.cdx.json",
    build: generateSbom,
  },
  {
    id: "release-notes",
    path: "docs/generated/release-notes.md",
    build: generateReleaseNotes,
  },
];

const CANONICAL_REPOSITORY_URL = "git+https://github.com/studio-jami/studio-ui.git";

if (only && !artifactTargets.some((target) => target.id === only)) {
  console.error(`unknown --only target: ${only}`);
  console.error(`supported targets: ${artifactTargets.map((target) => target.id).join(", ")}`);
  process.exit(1);
}

function readText(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function sha256Hex(text) {
  return createHash("sha256").update(text).digest("hex");
}

function sha256(text) {
  return `sha256:${sha256Hex(text)}`;
}

function posixPath(path) {
  return path.replaceAll("\\", "/");
}

function listDirs(relPath) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((name) => statSync(join(abs, name)).isDirectory())
    .sort();
}

function listFilesRecursive(relPath, predicate = () => true) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) return [];
  const out = [];
  for (const entry of readdirSync(abs).sort()) {
    const childAbs = join(abs, entry);
    const childRel = posixPath(join(relPath, entry));
    if (statSync(childAbs).isDirectory()) {
      out.push(...listFilesRecursive(childRel, predicate));
    } else if (predicate(childRel)) {
      out.push(childRel);
    }
  }
  return out;
}

function workspaceManifestPaths() {
  return [
    "package.json",
    ...listDirs("packages").map((name) => `packages/${name}/package.json`),
    ...listDirs("apps").map((name) => `apps/${name}/package.json`),
  ].filter((path) => existsSync(join(root, path)));
}

function validateWorkspaceReleasePosture(manifests) {
  const failures = [];
  for (const { path, manifest } of manifests) {
    if (manifest.private !== true) {
      failures.push(`${path}: workspace packages must remain private:true until Group E release gates close`);
    }
    if (manifest.repository?.type !== "git" || manifest.repository?.url !== CANONICAL_REPOSITORY_URL) {
      failures.push(`${path}: repository must point at ${CANONICAL_REPOSITORY_URL}`);
    }
    if (path !== "package.json") {
      const expectedDirectory = path.replace(/\/package\.json$/, "");
      if (manifest.repository?.directory !== expectedDirectory) {
        failures.push(`${path}: repository.directory must be ${expectedDirectory}`);
      }
    }
  }
  if (failures.length > 0) {
    throw new Error(`release package metadata drift:\n- ${failures.join("\n- ")}`);
  }
}

function collectDeclaredDependencies(manifest) {
  const fields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  const out = [];
  for (const field of fields) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      out.push({ field, name, range });
    }
  }
  return out.sort((a, b) => `${a.field}:${a.name}`.localeCompare(`${b.field}:${b.name}`));
}

function componentTypeForPath(path) {
  if (path === "package.json") return "application";
  if (path.startsWith("apps/")) return "application";
  return "library";
}

function workspaceRef(manifest, path) {
  if (path === "package.json") return "studio-ui:workspace:root";
  return `studio-ui:workspace:${manifest.name}`;
}

function packagePurl(name, version) {
  const scoped = name.match(/^@([^/]+)\/(.+)$/);
  if (scoped) return `pkg:npm/%40${encodeURIComponent(scoped[1])}/${encodeURIComponent(scoped[2])}@${version}`;
  return `pkg:npm/${encodeURIComponent(name)}@${version}`;
}

function buildWorkspaceComponents(paths) {
  return paths.map((path) => {
    const raw = readText(path);
    const manifest = JSON.parse(raw);
    const deps = collectDeclaredDependencies(manifest);
    return {
      type: componentTypeForPath(path),
      "bom-ref": workspaceRef(manifest, path),
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      scope: "required",
      purl: packagePurl(manifest.name, manifest.version),
      licenses: [{ license: { id: manifest.license ?? "NOASSERTION" } }],
      hashes: [{ alg: "SHA-256", content: sha256Hex(raw) }],
      properties: [
        { name: "studio-ui:workspace-path", value: path.replace(/\/?package\.json$/, "") || "." },
        { name: "studio-ui:private", value: String(manifest.private === true) },
        { name: "studio-ui:repository", value: manifest.repository?.url ?? "" },
        { name: "studio-ui:repository-directory", value: manifest.repository?.directory ?? "." },
        { name: "studio-ui:declared-dependency-count", value: String(deps.length) },
      ],
    };
  });
}

function externalDependencyComponents(paths, workspaceNames) {
  const byRef = new Map();
  for (const path of paths) {
    const manifest = readJson(path);
    for (const dep of collectDeclaredDependencies(manifest)) {
      if (workspaceNames.has(dep.name)) continue;
      const ref = `studio-ui:external:${dep.name}@${dep.range}`;
      if (!byRef.has(ref)) {
        byRef.set(ref, {
          type: "library",
          "bom-ref": ref,
          name: dep.name,
          version: dep.range,
          scope: dep.field === "devDependencies" ? "excluded" : "required",
          properties: [
            { name: "studio-ui:declared-range", value: dep.range },
            { name: "studio-ui:dependency-field", value: dep.field },
            {
              name: "studio-ui:resolution-posture",
              value: "declared-only; lockfile resolution must be reviewed before publish",
            },
          ],
        });
      }
    }
  }
  return [...byRef.values()].sort((a, b) => a["bom-ref"].localeCompare(b["bom-ref"]));
}

function dependencyRefsForManifest(manifest, workspaceNames) {
  return collectDeclaredDependencies(manifest).map((dep) => {
    if (workspaceNames.has(dep.name)) return `studio-ui:workspace:${dep.name}`;
    return `studio-ui:external:${dep.name}@${dep.range}`;
  });
}

function registryBundleEvidence() {
  const files = listFilesRecursive("packages/registry/generated", (path) => path.endsWith(".json"));
  const manifest = files.map((path) => `${path}\t${sha256(readText(path))}`).join("\n") + "\n";
  return {
    files,
    manifestHash: sha256Hex(manifest),
  };
}

function generateSbom() {
  const paths = workspaceManifestPaths();
  const manifests = paths.map((path) => ({ path, manifest: readJson(path) }));
  validateWorkspaceReleasePosture(manifests);
  const workspaceNames = new Set(manifests.map(({ manifest }) => manifest.name));
  const workspaceComponents = buildWorkspaceComponents(paths);
  const externalComponents = externalDependencyComponents(paths, workspaceNames);
  const rootManifest = manifests.find(({ path }) => path === "package.json")?.manifest;
  const lockfile = readText("pnpm-lock.yaml");
  const registryBundle = registryBundleEvidence();
  const registryIndex = readText("packages/registry/generated/registry.json");
  const nodeRef = "studio-ui:runtime:node";
  const lockfileRef = "studio-ui:file:pnpm-lock.yaml";
  const registryBundleRef = "studio-ui:file:packages/registry/generated";
  const registryIndexRef = "studio-ui:file:packages/registry/generated/registry.json";

  const dependencies = [
    {
      ref: "studio-ui:workspace:root",
      dependsOn: [
        nodeRef,
        lockfileRef,
        registryBundleRef,
        registryIndexRef,
        ...workspaceComponents
          .filter((component) => component["bom-ref"] !== "studio-ui:workspace:root")
          .map((component) => component["bom-ref"]),
      ].sort(),
    },
    ...manifests
      .filter(({ path }) => path !== "package.json")
      .map(({ path, manifest }) => ({
        ref: workspaceRef(manifest, path),
        dependsOn: [nodeRef, ...dependencyRefsForManifest(manifest, workspaceNames)].sort(),
      })),
    ...externalComponents.map((component) => ({ ref: component["bom-ref"], dependsOn: [] })),
    { ref: nodeRef, dependsOn: [] },
    { ref: lockfileRef, dependsOn: [] },
    { ref: registryBundleRef, dependsOn: [registryIndexRef] },
    { ref: registryIndexRef, dependsOn: [] },
  ];

  const bom = {
    $schema: "https://cyclonedx.org/schema/bom-1.7.schema.json",
    bomFormat: "CycloneDX",
    specVersion: "1.7",
    version: 1,
    metadata: {
      component: workspaceComponents.find((component) => component["bom-ref"] === "studio-ui:workspace:root"),
      tools: {
        components: [
          {
            type: "application",
            name: "studio-ui-local-release-artifacts",
            version: "2026-06-09",
            author: "Jami.Studio",
            properties: [
              { name: "studio-ui:generator", value: "scripts/release/generate-release-artifacts.mjs" },
              { name: "studio-ui:npm-sbom-used", value: "false" },
            ],
          },
        ],
      },
    },
    components: [
      ...workspaceComponents.filter((component) => component["bom-ref"] !== "studio-ui:workspace:root"),
      ...externalComponents,
      {
        type: "platform",
        "bom-ref": nodeRef,
        name: "Node.js",
        version: rootManifest.engines?.node ?? ">=24.0.0",
        scope: "required",
        properties: [{ name: "studio-ui:version-source", value: "package.json engines.node" }],
      },
      {
        type: "file",
        "bom-ref": lockfileRef,
        name: "pnpm-lock.yaml",
        hashes: [{ alg: "SHA-256", content: sha256Hex(lockfile) }],
        properties: [
          { name: "studio-ui:package-manager", value: rootManifest.packageManager ?? "pnpm" },
          { name: "studio-ui:resolved-third-party-package-count", value: String(externalComponents.length) },
        ],
      },
      {
        type: "file",
        "bom-ref": registryBundleRef,
        name: "packages/registry/generated",
        hashes: [{ alg: "SHA-256", content: registryBundle.manifestHash }],
        properties: [
          { name: "studio-ui:generated-registry-file-count", value: String(registryBundle.files.length) },
          { name: "studio-ui:bundle-hash-input", value: "path plus sha256 for each generated registry JSON file" },
        ],
      },
      {
        type: "file",
        "bom-ref": registryIndexRef,
        name: "packages/registry/generated/registry.json",
        hashes: [{ alg: "SHA-256", content: sha256Hex(registryIndex) }],
      },
    ],
    dependencies,
    properties: [
      { name: "studio-ui:source-posture", value: "local deterministic generator over manifests, lockfile, and generated registry artifacts" },
      { name: "studio-ui:cyclonedx-predicate-type", value: "https://cyclonedx.org/bom" },
      { name: "studio-ui:hosted-registry-claimed", value: "pages-dev-preview-only" },
      { name: "studio-ui:custom-registry-domain-claimed", value: "false" },
      { name: "studio-ui:npm-package-publish-claimed", value: "false" },
      { name: "studio-ui:attestation-executed", value: "false" },
      { name: "studio-ui:workspace-package-count", value: String(workspaceComponents.length) },
      { name: "studio-ui:third-party-package-count", value: String(externalComponents.length) },
    ],
  };

  return `${JSON.stringify(bom, null, 2)}\n`;
}

function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  if (lines[0] !== "---") {
    return { meta: {}, body: normalized.trim() };
  }
  const end = lines.indexOf("---", 1);
  if (end < 0) {
    return { meta: {}, body: normalized.trim() };
  }
  const meta = {};
  for (const line of lines.slice(1, end)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (match) meta[match[1]] = match[2].trim();
  }
  return { meta, body: lines.slice(end + 1).join("\n").trim() };
}

function ascii(text) {
  return text
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201c", "\"")
    .replaceAll("\u201d", "\"")
    .replaceAll("\u2013", "-")
    .replaceAll("\u2014", "-")
    .replaceAll("\u2192", "->");
}

function firstNote(body) {
  const blocks = body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const first = blocks.find((block) => !block.startsWith("#")) ?? blocks[0] ?? "(empty fragment)";
  const lines = first
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^#+\s*/, ""))
    .filter(Boolean);
  const firstBulletIndex = lines.findIndex((line) => /^[-*]\s+/.test(line));
  if (firstBulletIndex >= 0) {
    const bulletLines = [];
    for (const line of lines.slice(firstBulletIndex)) {
      if (bulletLines.length > 0 && /^[-*]\s+/.test(line)) break;
      bulletLines.push(line.replace(/^[-*]\s+/, ""));
    }
    return ascii(bulletLines.join(" "));
  }
  return ascii(lines.join(" "));
}

function collectFragments() {
  const dir = join(root, ".changes");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort()
    .map((name) => {
      const raw = readText(`.changes/${name}`);
      const parsed = parseFrontmatter(raw);
      return {
        file: name,
        type: parsed.meta.type ?? "unclassified",
        surface: parsed.meta.surface ?? "unclassified",
        note: firstNote(parsed.body),
        hasFrontmatter: Boolean(parsed.meta.type || parsed.meta.surface),
      };
    });
}

function groupFragments(fragments) {
  const bySurface = new Map();
  for (const fragment of fragments) {
    if (!bySurface.has(fragment.surface)) bySurface.set(fragment.surface, new Map());
    const byType = bySurface.get(fragment.surface);
    if (!byType.has(fragment.type)) byType.set(fragment.type, []);
    byType.get(fragment.type).push(fragment);
  }
  return [...bySurface.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function generateReleaseNotes() {
  const fragments = collectFragments();
  const typedCount = fragments.filter((fragment) => fragment.hasFrontmatter).length;
  const lines = [
    "# Generated Release Notes",
    "",
    "Status: Generated from `.changes/` fragments, unreleased",
    "Source: `.changes/*.md`",
    "Generation command: `pnpm release:notes:generate`",
    "Check command: `pnpm release:notes:check`",
    "",
    "This file is generated by `scripts/release/generate-release-artifacts.mjs`. Do not edit it by hand.",
    "It is a deterministic rollup of accepted change fragments. The curated release posture, latest verification snapshot, and public caveats stay in `docs/operations/release-notes.md`.",
    "",
    "Nothing has been published. The generated notes do not claim a hosted registry, npm package publish, static-host publish, hosted persistence, backend registration, final brand canon, harness runtime behavior, or release attestations.",
    "",
    "## Summary",
    "",
    `- Total fragments: ${fragments.length}`,
    `- Typed fragments: ${typedCount}`,
    `- Unclassified legacy fragments: ${fragments.length - typedCount}`,
    "",
    "## Notes By Surface",
    "",
  ];

  for (const [surface, byType] of groupFragments(fragments)) {
    lines.push(`### ${surface}`, "");
    for (const [type, surfaceFragments] of [...byType.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`#### ${type}`, "");
      for (const fragment of surfaceFragments) {
        lines.push(`- \`${fragment.file}\` - ${fragment.note}`);
      }
      lines.push("");
    }
  }

  lines.push(
    "## Not Yet Claimed",
    "",
    "- No `registry.jami.studio` custom-domain registry endpoint.",
    "- No published npm packages or confirmed package-scope release.",
    "- No package publish attestation or DNS validation for the custom registry domain.",
    "- No release attestation execution.",
    "- No hosted persistence, backend package registration, or harness runtime behavior in this repo.",
    "- No final brand canon.",
    "",
  );

  return `${lines.join("\n")}`;
}

function compareOrWrite(path, contents) {
  const abs = join(root, path);
  if (check) {
    if (!existsSync(abs)) return [`${path}: missing generated artifact`];
    const current = readFileSync(abs, "utf8");
    return current === contents ? [] : [`${path}: generated artifact drift`];
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
  return [];
}

const selectedTargets = artifactTargets.filter((target) => !only || target.id === only);
const failures = selectedTargets.flatMap((target) => compareOrWrite(target.path, target.build()));

if (failures.length > 0) {
  console.error(check ? "release:artifacts:check failed" : "release:artifacts:generate failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const verb = check ? "check passed" : "wrote artifacts";
console.log(`${only ?? "release-artifacts"}: ${verb}`);

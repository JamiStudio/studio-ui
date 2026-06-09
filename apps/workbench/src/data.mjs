// Real-data loader for the Studio UI showcase.
//
// Everything the showcase displays is loaded from generated artifacts and the
// checked fixture corpus — never duplicated or hand-authored here:
//   - token CSS variables: packages/tokens/generated/jami.css
//   - registry items + suite descriptors: packages/registry/generated/registry.json
//   - suite manifests: packages/registry/generated/suites/<lane>.suite.json
//   - renderer compatibility payloads: packages/renderer/fixtures/compatibility/
//   - workbench presentation refs: packages/renderer/fixtures/presentation/
//
// The resident renderer and presentation seam are imported from the renderer
// package's public entry by relative path. This workspace runs every package
// directly with `node` and is not symlinked into node_modules, so a relative
// import to the published entry is the deterministic, install-free way to reuse
// the real renderer rather than re-implementing it.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  renderFixture,
  presentWorkbenchPanel,
} from "../../../packages/renderer/src/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, "..", "..", "..");

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8"));
}

function readText(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

// Parse the generated `:root { --jami-*: value; }` block into an ordered list of
// { name, value } token entries. Object-valued tokens (typography/shadow) keep
// their JSON string value; color tokens keep their hex.
export function parseTokenCss(css) {
  const tokens = [];
  // Greedy to the final brace: some token values are JSON objects that contain
  // their own `}` (typography/shadow), so a non-greedy capture would stop early.
  const body = /:root\s*\{([\s\S]*)\}/.exec(css)?.[1] ?? "";
  for (const line of body.split("\n")) {
    const match = /^\s*(--jami-[a-zA-Z0-9-]+)\s*:\s*(.+?);\s*$/.exec(line);
    if (match) tokens.push({ name: match[1], value: match[2].trim() });
  }
  return tokens;
}

function loadFixtureDir(relativeDir) {
  const dir = join(repoRoot, relativeDir);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ({ file, fixture: JSON.parse(readFileSync(join(dir, file), "utf8")) }));
}

const SUITE_LANES = ["solo", "business-ops", "mixed-media", "research-writing"];

// Assemble everything the page needs from real generated/fixture sources.
export function loadShowcaseData() {
  const tokenCss = readText("packages/tokens/generated/jami.css");
  const registry = readJson("packages/registry/generated/registry.json");
  const itemsByName = new Map(registry.items.map((item) => [item.name, item]));

  const suites = SUITE_LANES.map((lane) => {
    const manifest = readJson(`packages/registry/generated/suites/${lane}.suite.json`);
    const item = itemsByName.get(`${lane}-suite`);
    // Resolve each declared member to its real registry item so installable vs
    // source-pending state is read from generated metadata, never assumed.
    const members = (manifest.items ?? []).map((memberName) => {
      const member = itemsByName.get(memberName);
      const files = member?.files ?? [];
      const installable = files.length > 0 && files.every((f) => typeof f.content === "string");
      const sourcePending = files.length > 0 && files.every((f) => typeof f.content !== "string");
      return {
        name: memberName,
        type: member?.type ?? null,
        version: member?.meta?.lifecycle?.version ?? null,
        sourceState: installable ? "installable" : sourcePending ? "source-pending" : "partial",
      };
    });
    return { lane, manifest, item, members };
  });

  // Render the compatibility fixtures through the real resident renderer.
  const compatFixtures = [
    ...loadFixtureDir("packages/renderer/fixtures/compatibility/valid"),
    ...loadFixtureDir("packages/renderer/fixtures/compatibility/invalid"),
  ].map(({ file, fixture }) => ({
    file,
    fixture,
    rendered: renderFixture(fixture),
  }));

  // Present the presentation fixtures through the real workbench seam.
  const presentationPanels = loadFixtureDir("packages/renderer/fixtures/presentation").map(
    ({ file, fixture }) => ({
      file,
      fixture,
      presented: presentWorkbenchPanel({
        kind: fixture.kind,
        ref: fixture.ref,
        lifecycle: fixture.lifecycle,
      }),
    }),
  );

  return {
    tokenCss,
    tokens: parseTokenCss(tokenCss),
    registry,
    suites,
    compatFixtures,
    presentationPanels,
  };
}

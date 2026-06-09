// Build the static Studio UI showcase into apps/workbench/dist/.
//
// Emits:
//   dist/index.html          — default (factory) theme, with the working theme switcher
//   dist/theme-<name>.html   — one theme-locked file per theme, for screenshot evidence
//   dist/focus.html          — factory theme with the first control auto-focused (focus evidence)
//   dist/build-manifest.json — what was built, from which sources
//
// dist/ is gitignored; the page is reproducible from generated artifacts and the
// checked fixture corpus by re-running this script.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadShowcaseData } from "./src/data.mjs";
import { THEMES, buildPage } from "./src/page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, "dist");

export function build() {
  const data = loadShowcaseData();
  mkdirSync(distDir, { recursive: true });

  const written = [];
  function emit(name, html) {
    const path = join(distDir, name);
    writeFileSync(path, html, "utf8");
    written.push(name);
  }

  emit("index.html", buildPage(data, { theme: "factory" }));
  for (const theme of THEMES) {
    emit(`theme-${theme}.html`, buildPage(data, { theme }));
  }
  emit("focus.html", buildPage(data, { theme: "factory", focusFirst: true }));

  const manifest = {
    generatedBy: "apps/workbench/build.mjs",
    themes: THEMES,
    files: written,
    counts: {
      suites: data.suites.length,
      compatibilityFixtures: data.compatFixtures.length,
      presentationPanels: data.presentationPanels.length,
      colorTokens: data.tokens.filter((t) => /^#[0-9a-fA-F]{6}$/.test(t.value)).length,
    },
    sources: [
      "packages/tokens/generated/jami.css",
      "packages/registry/generated/registry.json",
      "packages/registry/generated/suites/*.suite.json",
      "packages/renderer/fixtures/compatibility/*",
      "packages/renderer/fixtures/presentation/*",
    ],
  };
  emit("build-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);

  return { distDir, written, counts: manifest.counts };
}

// Run when invoked directly.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = build();
  console.log(`workbench showcase built -> ${result.distDir}`);
  for (const file of result.written) console.log(`  ${file}`);
}

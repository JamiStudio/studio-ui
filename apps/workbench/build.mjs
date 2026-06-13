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

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadShowcaseData } from "./src/data.mjs";
import { THEMES, buildPage, buildStaticInfoPage, buildSuiteRoutePage } from "./src/page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, "dist");

const HOSTED_ROUTE_SOURCE_LOCKS = [
  {
    id: "cloudflare-pages-direct-upload",
    title: "Cloudflare Pages Direct Upload",
    url: "https://developers.cloudflare.com/pages/get-started/direct-upload/",
    checkedOn: "2026-06-12",
  },
  {
    id: "cloudflare-pages-headers",
    title: "Cloudflare Pages custom headers",
    url: "https://developers.cloudflare.com/pages/configuration/headers/",
    checkedOn: "2026-06-12",
  },
  {
    id: "cloudflare-pages-serving",
    title: "Cloudflare Pages serving static assets",
    url: "https://developers.cloudflare.com/pages/configuration/serving-pages/",
    checkedOn: "2026-06-12",
  },
  {
    id: "cloudflare-pages-custom-domains",
    title: "Cloudflare Pages custom domains",
    url: "https://developers.cloudflare.com/pages/configuration/custom-domains/",
    checkedOn: "2026-06-13",
  },
];

export function build() {
  const data = loadShowcaseData();
  mkdirSync(distDir, { recursive: true });

  const written = [];
  function emit(name, html) {
    const path = join(distDir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, html, "utf8");
    written.push(name);
  }

  function copyGeneratedJson(sourceRel, targetRel) {
    const text = readFileSync(join(here, "..", "..", sourceRel), "utf8");
    emit(targetRel, text);
  }

  function copyGeneratedJsonTree(sourceRel, targetRel) {
    const sourceAbs = join(here, "..", "..", sourceRel);
    for (const entry of readdirSync(sourceAbs).sort()) {
      const childSource = join(sourceRel, entry).replaceAll("\\", "/");
      const childTarget = join(targetRel, entry).replaceAll("\\", "/");
      const childAbs = join(here, "..", "..", childSource);
      if (statSync(childAbs).isDirectory()) {
        copyGeneratedJsonTree(childSource, childTarget);
      } else if (entry.endsWith(".json")) {
        copyGeneratedJson(childSource, childTarget);
      }
    }
  }

  emit("index.html", buildPage(data, { theme: "factory" }));
  for (const theme of THEMES) {
    emit(`theme-${theme}.html`, buildPage(data, { theme }));
  }
  emit("focus.html", buildPage(data, { theme: "factory", focusFirst: true }));

  for (const suite of data.mountedSuiteRoutes) {
    emit(suite.app.file, buildSuiteRoutePage(data, { lane: suite.lane, html: suite.app.html }));
    for (const page of suite.pages) {
      emit(page.file, buildSuiteRoutePage(data, { lane: suite.lane, path: page.path, html: page.html }));
    }
  }

  copyGeneratedJson("packages/registry/generated/registry.json", "registry.json");
  copyGeneratedJson("packages/registry/generated/registry.json", "registry/registry.json");
  copyGeneratedJsonTree("packages/registry/generated/items", "registry/items");
  copyGeneratedJsonTree("packages/registry/generated/suites", "registry/suites");

  emit(
    "docs/registry.html",
    buildStaticInfoPage(data, {
      title: "Studio UI Registry Preview",
      heading: "Registry Preview Route",
      body:
        '<p>Static registry route preview. Source bundle: <code>packages/registry/generated</code>. The public custom domain <code>registry.jami.studio</code> serves the registry JSON and docs routes; this local workbench/showcase artifact is not yet deployed there.</p>',
    }),
  );
  emit(
    "docs/workbench.html",
    buildStaticInfoPage(data, {
      title: "Studio UI Workbench Preview",
      heading: "Workbench Preview Route",
      body:
        '<p>Local preview of the future hosted workbench/showcase route. It uses generated tokens, registry data, suite React route artifacts, resident renderer fixtures, and local overlay state. Hosted workbench routing, persistence, and backend registration are not claimed.</p>',
    }),
  );
  emit(
    "docs/suites.html",
    buildStaticInfoPage(data, {
      title: "Studio UI Suite Routes Preview",
      heading: "Suite Routes Preview",
      body:
        '<p>Local preview index for mounted React suite app/page/block routes. The route files are server-rendered static artifacts from <code>packages/ui/src/suites.mjs</code>; hosted suite routes and hosted runtime state are not claimed.</p>',
    }),
  );

  const humanActions = [
    "Deploy and smoke the hosted workbench/showcase and suite route artifacts.",
    "Define revisioned-item URL policy for long-lived registry artifacts.",
    "Implement hosted persistence and backend package registration before claiming save/register across sessions.",
  ];
  const hostedRouteManifest = {
    $schema: "https://jami.studio/schemas/studio-ui/hosted-route-readiness.generated.json",
    generatedBy: "apps/workbench/build.mjs",
    status: "public-registry-docs-live-workbench-preview",
    publicRegistryClaimed: true,
    publicDocsClaimed: true,
    publicWorkbenchClaimed: false,
    publicSuiteRoutesClaimed: false,
    hostedPersistenceClaimed: false,
    backendRegistrationClaimed: false,
    targetHost: "registry.jami.studio",
    sourceLocks: HOSTED_ROUTE_SOURCE_LOCKS,
    routes: [
      {
        id: "registry-index",
        kind: "registry",
        targetUrl: "https://registry.jami.studio/registry.json",
        localArtifact: "registry.json",
        deployed: true,
      },
      {
        id: "docs-registry",
        kind: "docs",
        targetUrl: "https://registry.jami.studio/docs/registry",
        localArtifact: "docs/registry.html",
        deployed: true,
      },
      {
        id: "docs-workbench",
        kind: "docs",
        targetUrl: "https://registry.jami.studio/docs/workbench",
        localArtifact: "docs/workbench.html",
        deployed: false,
      },
      {
        id: "workbench-showcase",
        kind: "workbench-showcase",
        targetUrl: "https://registry.jami.studio/",
        localArtifact: "index.html",
        deployed: false,
        hostedPersistence: false,
        backendRegistration: false,
      },
      ...data.mountedSuiteRoutes.flatMap((suite) => [
        {
          id: `${suite.lane}-suite-app`,
          kind: "suite-app",
          targetUrl: `https://registry.jami.studio/suites/${suite.lane}/`,
          localArtifact: suite.app.file,
          deployed: false,
          hostedRuntime: false,
        },
        ...suite.pages.map((page) => ({
          id: `${suite.lane}-${page.path.replace(/^\/+/, "").replace(/[^a-z0-9]+/g, "-")}`,
          kind: "suite-page",
          targetUrl: `https://registry.jami.studio/${page.file.replace(/index\.html$/, "")}`,
          localArtifact: page.file,
          sourceRoute: page.path,
          deployed: false,
          hostedRuntime: false,
        })),
      ]),
    ],
    missingHumanActions: humanActions,
  };
  emit("hosted-route-manifest.json", `${JSON.stringify(hostedRouteManifest, null, 2)}\n`);

  const manifest = {
    generatedBy: "apps/workbench/build.mjs",
    themes: THEMES,
    files: written,
    counts: {
      suites: data.suites.length,
      mountedSuiteRouteFiles: data.mountedSuiteRoutes.reduce((total, suite) => total + 1 + suite.pages.length, 0),
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

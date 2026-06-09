// Browser + accessibility + visual smoke for the Studio UI showcase.
//
// Dependency-free: it drives an already-installed Chromium-family browser
// (Microsoft Edge or Google Chrome) in headless mode to capture real
// screenshots, and runs a structural accessibility + WCAG-contrast audit over
// the built HTML. It does NOT add Playwright or any npm dependency, and it is
// intentionally NOT part of `pnpm verify` (which stays dependency-free and
// browserless). Run it explicitly:
//
//   node apps/workbench/smoke/a11y-visual-smoke.mjs
//
// Outputs (gitignored) under apps/workbench/output/:
//   screenshots/theme-<name>.png   — full page per theme (desktop width)
//   screenshots/focus.png          — keyboard :focus-visible ring evidence
//   screenshots/responsive.png     — narrow viewport (single-column) evidence
//   a11y-report.json               — structural a11y + contrast results
//
// If no browser is found, the audit still runs and screenshots are reported as
// skipped with the reason — the smoke never silently claims visual coverage it
// did not produce.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "../build.mjs";
import { loadShowcaseData } from "../src/data.mjs";
import { THEMES, buildPage, computeContrastRows } from "../src/page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const appDir = join(here, "..");
const distDir = join(appDir, "dist");
const outDir = join(appDir, "output");
const shotsDir = join(outDir, "screenshots");

const BROWSER_CANDIDATES = [
  process.env.STUDIO_UI_BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].filter(Boolean);

function findBrowser() {
  return BROWSER_CANDIDATES.find((path) => existsSync(path)) ?? null;
}

function fileUrl(path) {
  return `file://${path.replace(/\\/g, "/")}`;
}

function capture(browser, htmlFile, pngFile, { width, height }) {
  const result = spawnSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--force-color-profile=srgb",
      `--window-size=${width},${height}`,
      `--screenshot=${pngFile}`,
      fileUrl(htmlFile),
    ],
    { encoding: "utf8", timeout: 60000 },
  );
  const ok = existsSync(pngFile);
  return { ok, status: result.status, stderr: ok ? null : (result.stderr ?? "").slice(-400) };
}

// --- structural accessibility + contrast audit (browserless) -----------------

function auditPage(html, tokens) {
  const checks = [
    ["document language set", /<html[^>]*\slang="[a-z-]+"/i.test(html)],
    ["skip link to main", html.includes('class="ju-skip" href="#ju-main"')],
    ["single main landmark", (html.match(/<main\b/gi) ?? []).length === 1],
    ["labelled nav landmark", /<nav[^>]*aria-label=/.test(html)],
    ["labelled theme group", html.includes('role="group" aria-label="Theme"')],
    ["section headings labelled", html.includes("aria-labelledby=")],
    ["table headers scoped", html.includes('scope="col"')],
    ["viewport meta for responsive", html.includes('name="viewport"')],
    ["reduced-motion guard", html.includes("prefers-reduced-motion: reduce")],
    ["narrow-viewport layout", html.includes("@media (max-width: 640px)")],
    ["visible focus ring", html.includes(":focus-visible")],
    ["no inline event handlers", !/<[^>]+\son[a-z]+\s*=/i.test(html)],
    ["no javascript: URLs", !/(href|src)\s*=\s*["']?\s*javascript:/i.test(html)],
    ["single app-shell script", (html.match(/<script/gi) ?? []).length === 1],
  ].map(([name, pass]) => ({ name, pass }));

  const contrast = computeContrastRows(tokens).map((row) => ({
    pair: row.label,
    fg: row.fg,
    bg: row.bg,
    ratio: row.ratio,
    target: row.min,
    level: row.level,
    pass: row.pass,
  }));

  return { checks, contrast };
}

function main() {
  build();
  mkdirSync(shotsDir, { recursive: true });
  const data = loadShowcaseData();

  const audit = auditPage(buildPage(data, { theme: "factory" }), data.tokens);
  const browser = findBrowser();

  const screenshots = [];
  if (browser) {
    for (const theme of THEMES) {
      const png = join(shotsDir, `theme-${theme}.png`);
      screenshots.push({ name: `theme-${theme}`, file: png, ...capture(browser, join(distDir, `theme-${theme}.html`), png, { width: 1280, height: 2600 }) });
    }
    const focusPng = join(shotsDir, "focus.png");
    screenshots.push({ name: "focus", file: focusPng, ...capture(browser, join(distDir, "focus.html"), focusPng, { width: 1280, height: 900 }) });
    const respPng = join(shotsDir, "responsive.png");
    screenshots.push({ name: "responsive", file: respPng, ...capture(browser, join(distDir, "theme-factory.html"), respPng, { width: 390, height: 3200 }) });
  }

  const checksFailed = audit.checks.filter((c) => !c.pass);
  const contrastFailed = audit.contrast.filter((c) => !c.pass);
  const shotsFailed = browser ? screenshots.filter((s) => !s.ok) : [];

  const report = {
    tool: "apps/workbench/smoke/a11y-visual-smoke.mjs",
    browser: browser ?? "(none found — screenshots skipped)",
    audit,
    screenshots: screenshots.map((s) => ({ name: s.name, file: s.file, ok: s.ok, stderr: s.stderr })),
    summary: {
      structuralChecks: `${audit.checks.length - checksFailed.length}/${audit.checks.length} passed`,
      contrastChecks: `${audit.contrast.length - contrastFailed.length}/${audit.contrast.length} passed`,
      screenshots: browser ? `${screenshots.length - shotsFailed.length}/${screenshots.length} captured` : "skipped (no browser)",
    },
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "a11y-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("a11y/visual smoke report:");
  console.log(`  browser: ${report.browser}`);
  console.log(`  structural a11y: ${report.summary.structuralChecks}`);
  console.log(`  contrast: ${report.summary.contrastChecks}`);
  console.log(`  screenshots: ${report.summary.screenshots}`);
  for (const shot of report.screenshots) {
    console.log(`    ${shot.ok ? "ok" : "FAIL"}  ${shot.name} -> ${shot.file}`);
  }
  console.log(`  report -> ${join(outDir, "a11y-report.json")}`);

  const failed = checksFailed.length > 0 || contrastFailed.length > 0 || shotsFailed.length > 0;
  if (failed) {
    if (checksFailed.length) console.error(`structural checks failed: ${checksFailed.map((c) => c.name).join(", ")}`);
    if (contrastFailed.length) console.error(`contrast checks failed: ${contrastFailed.map((c) => c.pair).join(", ")}`);
    if (shotsFailed.length) console.error(`screenshots failed: ${shotsFailed.map((s) => s.name).join(", ")}`);
    process.exitCode = 1;
  }
}

main();

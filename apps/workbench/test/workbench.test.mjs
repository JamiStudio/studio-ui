// Deterministic, dependency-free checks for the Studio UI showcase surface.
//
// These run under `node --test` and are part of `pnpm verify`. They assert the
// page consumes real generated/fixture data, stays inert and escaped, tells the
// honest truth about installed vs pending surfaces, renders every theme, exposes
// accessible structure, and meets the contrast targets it displays. The real
// browser/screenshot pass lives in smoke/a11y-visual-smoke.mjs (run separately).

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { loadShowcaseData } from "../src/data.mjs";
import { THEMES, buildPage, computeContrastRows } from "../src/page.mjs";
import { contrastRatio, parseHex } from "../src/escape.mjs";
import { build } from "../build.mjs";

const data = loadShowcaseData();
const page = buildPage(data, { theme: "factory" });
const pageSource = readFileSync(new URL("../src/page.mjs", import.meta.url), "utf8");

test("consumes real generated token values, not duplicated data", () => {
  // The warm factory anchor and teal focus ring come straight from jami.css.
  assert.ok(page.includes("#C14D84"), "accent token hex present");
  assert.ok(page.includes("#237C7A"), "focus-ring token hex present");
  assert.ok(page.includes("--jami-semantic-light-background"), "generated CSS var present");
  assert.ok(data.tokens.length >= 15, "parsed the generated token set");
});

test("showcase source stays tokenized and avoids decorative gradient backgrounds", () => {
  assert.equal(/#[0-9a-fA-F]{3,8}/.test(pageSource), false, "no literal hex colors in workbench source");
  assert.equal(/(?:radial|linear)-gradient/.test(pageSource), false, "no decorative gradient backgrounds");
});

test("consumes real registry + generated suite shell descriptors", () => {
  assert.ok(page.includes("@jami-studio/solo-suite"));
  assert.ok(page.includes("2026-06-09.registry-foundation"), "suite schema version echoed");
  assert.ok(page.includes("app.solo.shell"), "authored solo shell id rendered");
  assert.ok(page.includes("/business-ops/dashboard"), "business ops route rendered from shell");
  assert.ok(page.includes("block.mixed-media.assets"), "mixed media block graph rendered");
  assert.ok(page.includes("page.research-writing.sources"), "research-writing page graph rendered");
  // Real planned surfaces from the generated manifests.
  for (const surface of ["calendar", "forms", "docs", "agent", "tasks"]) {
    assert.ok(page.includes(`>${surface}<`), `solo planned surface ${surface} present`);
  }
});

test("all four lanes render generated suite shell routes without claiming React runtime", () => {
  for (const lane of ["solo", "business-ops", "mixed-media", "research-writing"]) {
    assert.ok(page.includes(`id="suite-${lane}"`), `${lane} section present`);
    assert.ok(data.suites.find((s) => s.lane === lane).manifest.shell, `${lane} generated shell present`);
  }
  const liveRouteBadges = page.match(/generated shell route/g) ?? [];
  assert.equal(liveRouteBadges.length, 4, "all four lanes render generated shell routes");
  assert.ok(page.includes("React app implementation pending"), "runtime implementation gap labelled");
});

test("does not fabricate runtime installs: generated shells and installable members are detected", () => {
  assert.ok(page.includes("full React suite app implementations"), "runtime gap is explicit");
  // Generated registry metadata is the source of truth for installability.
  for (const suite of data.suites) {
    assert.ok(suite.members.find((m) => m.name === "jami-theme"), `${suite.lane} theme member`);
    assert.ok(suite.members.every((m) => m.sourceState === "installable"), `${suite.lane} members installable`);
  }
  assert.ok(page.includes("installable"), "installable state surfaced");
});

test("output is inert: no inline event handlers, no javascript: URLs, one app-shell script", () => {
  assert.equal(/(href|src)\s*=\s*["']?\s*javascript:/i.test(page), false, "no javascript: URLs");
  assert.equal(/<[^>]+\son[a-z]+\s*=/i.test(page), false, "no inline event-handler attributes");
  const scriptTags = page.match(/<script/gi) ?? [];
  assert.equal(scriptTags.length, 1, "exactly one (theme switcher) script");
  assert.ok(page.includes("addEventListener"), "theme switcher uses addEventListener, not inline handlers");
});

test("renders the resident renderer fixtures, including fail-closed states", () => {
  // A renderable button payload becomes a real <button>.
  assert.ok(/<button[^>]*class="ju-btn"[^>]*>Save<\/button>/.test(page), "Save button rendered");
  // At least one invalid fixture fails closed to the renderer-owned fallback.
  assert.ok(page.includes("Invalid (failed closed)"), "invalid badge present");
  assert.ok(
    page.includes("rejected by the resident renderer"),
    "renderer-owned fallback copy present",
  );
  // A denied action is shown as denied, display-only.
  assert.ok(page.includes("Denied by harness policy"));
  assert.ok(page.includes(">Denied<") || page.includes("Denied"), "denied state surfaced");
});

test("renders workbench presentation panels with operational statuses", () => {
  for (const status of ["ready", "redacted", "stale", "empty", "error", "denied", "missing-source", "loading"]) {
    assert.ok(
      page.includes(`data-status="${status}"`),
      `presentation status ${status} appears`,
    );
  }
});

test("never echoes redacted memory content", () => {
  // memory-record.redacted fixture gates its content; the literal must not leak.
  const redacted = data.presentationPanels.find((p) => p.file === "memory-record.redacted.json");
  assert.ok(redacted, "redacted memory fixture loaded");
  assert.equal(redacted.presented.status, "redacted");
  assert.equal(redacted.presented.descriptor.body.content, null, "content gated to null");
});

test("every theme builds and sets the active pressed control", () => {
  for (const theme of THEMES) {
    const themed = buildPage(data, { theme });
    assert.ok(themed.includes(`data-theme="${theme}"`), `html data-theme=${theme}`);
    assert.ok(
      themed.includes(`data-theme-value="${theme}"`) &&
        new RegExp(`data-theme-value="${theme}"[^>]*aria-pressed="true"`).test(themed),
      `${theme} control pressed`,
    );
  }
});

test("accessible structure: skip link, landmarks, labelled groups, scoped headers", () => {
  assert.ok(page.includes('class="ju-skip" href="#ju-main"'), "skip link");
  assert.ok(page.includes('<main id="ju-main">'), "main landmark");
  assert.ok(/<nav class="ju-nav" aria-label="Sections">/.test(page), "labelled nav");
  assert.ok(page.includes('role="group" aria-label="Theme"'), "labelled theme group");
  assert.ok(page.includes('scope="col"'), "table headers are scoped");
  assert.ok(page.includes('lang="en"'), "document language set");
});

test("responsive + reduced-motion affordances are present", () => {
  assert.ok(page.includes('name="viewport"'), "viewport meta");
  assert.ok(page.includes("@media (max-width: 640px)"), "narrow-viewport layout");
  assert.ok(page.includes("prefers-reduced-motion: reduce"), "reduced-motion guard");
});

test("long content wraps instead of overflowing", () => {
  assert.ok(page.includes("overflow-wrap: anywhere"), "long ids/hashes wrap");
  // A genuinely long real value is on the page and relies on wrapping: the solo
  // suite's full descriptor sentence from the generated registry item and shell.
  const solo = data.suites.find((s) => s.lane === "solo");
  assert.ok(solo.item.description.length > 80, "real long descriptor exists");
  assert.ok(page.includes(solo.item.description), "long descriptor rendered on the page");
  assert.ok(page.includes(solo.manifest.shell.stateFixtures.longContent), "long-content state rendered");
});

test("displayed contrast ratios are computed correctly and meet their targets", () => {
  const rows = computeContrastRows(data.tokens);
  assert.ok(rows.length >= 4);
  for (const row of rows) {
    assert.ok(parseHex(row.fg), `fg ${row.fg} is a hex`);
    assert.ok(parseHex(row.bg), `bg ${row.bg} is a hex`);
    assert.equal(row.ratio, contrastRatio(row.fg, row.bg), "ratio recomputes identically");
    assert.ok(row.ratio >= row.min, `${row.label} meets ${row.min}:1 (got ${row.ratio})`);
  }
  // Body text pairs must clear WCAG AA for normal text.
  const lightText = rows.find((r) => r.label.startsWith("Light text"));
  assert.ok(lightText.ratio >= 4.5, `light body text AA (got ${lightText.ratio})`);
});

test("build() emits the page and per-theme files from real sources", () => {
  const result = build();
  for (const file of ["index.html", "theme-factory.html", "theme-light.html", "theme-dark.html", "focus.html", "build-manifest.json"]) {
    assert.ok(result.written.includes(file), `emitted ${file}`);
    assert.ok(existsSync(join(result.distDir, file)), `${file} exists on disk`);
  }
  assert.equal(result.counts.suites, 4);
  assert.ok(result.counts.compatibilityFixtures >= 10);
  assert.ok(result.counts.presentationPanels >= 10);
});

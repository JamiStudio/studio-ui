// Assemble the Studio UI showcase page from real data.
//
// The page is a static, browser-renderable surface over the accepted Stream 5
// seams: the generated token theme, the generated registry + suite descriptors,
// the resident renderer, and the workbench presentation seam. It claims no
// harness runtime, no provider behavior, and no installed suite app — every
// pending surface is labelled as pending.

import { escapeAttr, escapeHtml, contrastRatio } from "./escape.mjs";
import {
  renderCompatCard,
  renderNodeHtml,
  renderPresentationPanel,
} from "./render-html.mjs";

export const THEMES = ["factory", "light", "dark"];

const THEME_LABEL = {
  factory: "Factory (warm)",
  light: "Light",
  dark: "Dark",
};

const SUITE_TITLE = {
  solo: "Solo / general workflow",
  "business-ops": "Business operations",
  "mixed-media": "Mixed media",
  "research-writing": "Research / writing",
};

// --- styles (token-driven) ---------------------------------------------------

function styles(tokenCss) {
  return `
/* Generated token output, consumed verbatim. */
${tokenCss}

/* Theme channel: map the active theme to the generated semantic tokens. */
html[data-theme="light"], html[data-theme="factory"] {
  color-scheme: light;
  --ju-bg: var(--jami-semantic-light-background);
  --ju-fg: var(--jami-semantic-light-foreground);
  --ju-accent: var(--jami-semantic-light-accent);
  --ju-ring: var(--jami-componentState-focusRing);
}
html[data-theme="dark"] {
  color-scheme: dark;
  --ju-bg: var(--jami-semantic-dark-background);
  --ju-fg: var(--jami-semantic-dark-foreground);
  --ju-accent: var(--jami-semantic-dark-accent);
  --ju-ring: var(--jami-componentState-focusRing);
}
/* Factory adds an accent-tinted page wash distinct from plain light. */
html[data-theme="factory"] body {
  background-image: radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--ju-accent) 10%, transparent), transparent 60%);
}

:root {
  --ju-surface: color-mix(in srgb, var(--ju-fg) 4%, var(--ju-bg));
  --ju-surface-2: color-mix(in srgb, var(--ju-fg) 8%, var(--ju-bg));
  --ju-border: color-mix(in srgb, var(--ju-fg) 18%, var(--ju-bg));
  --ju-muted: color-mix(in srgb, var(--ju-fg) 52%, var(--ju-bg));
  --ju-radius: var(--jami-radius-control, 8px);
  --ju-gap: var(--jami-spacing-control, 8px);
  --ju-motion: var(--jami-motion-fast, 120ms);
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--ju-bg);
  color: var(--ju-fg);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  min-height: 100vh;
}

a { color: var(--ju-accent); }

/* Visible, token-driven focus for every interactive element. */
a:focus-visible, button:focus-visible, [tabindex]:focus-visible, summary:focus-visible {
  outline: 3px solid var(--ju-ring);
  outline-offset: 2px;
  border-radius: 4px;
}

.ju-skip {
  position: absolute;
  left: -999px;
  top: 0;
  background: var(--ju-accent);
  color: var(--ju-bg);
  padding: 8px 14px;
  z-index: 10;
}
.ju-skip:focus { left: 8px; top: 8px; }

.ju-shell { max-width: 1180px; margin: 0 auto; padding: clamp(16px, 4vw, 40px); }

header.ju-header { border-bottom: 1px solid var(--ju-border); }
.ju-header h1 { margin: 0 0 4px; font-size: clamp(1.4rem, 3vw, 2rem); }
.ju-header p { margin: 0; color: var(--ju-muted); max-width: 70ch; }

.ju-toolbar { display: flex; flex-wrap: wrap; gap: var(--ju-gap); align-items: center; margin-top: 18px; }
.ju-toolbar > span.ju-toolbar-label { color: var(--ju-muted); font-size: 0.85rem; }
.ju-theme-btn {
  font: inherit;
  padding: 7px 14px;
  border-radius: var(--ju-radius);
  border: 1px solid var(--ju-border);
  background: var(--ju-surface);
  color: var(--ju-fg);
  cursor: pointer;
  transition: background var(--ju-motion) ease, border-color var(--ju-motion) ease;
}
.ju-theme-btn[aria-pressed="true"] {
  background: var(--ju-accent);
  color: var(--ju-bg);
  border-color: var(--ju-accent);
}

nav.ju-nav { margin: 20px 0; }
nav.ju-nav ul { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; margin: 0; padding: 0; }
nav.ju-nav a {
  text-decoration: none;
  padding: 6px 12px;
  border: 1px solid var(--ju-border);
  border-radius: 999px;
  background: var(--ju-surface);
  color: var(--ju-fg);
  font-size: 0.9rem;
}

section.ju-section { margin: 36px 0; }
.ju-section > h2 { font-size: 1.3rem; margin: 0 0 4px; }
.ju-section > p.ju-lead { margin: 0 0 18px; color: var(--ju-muted); max-width: 70ch; }

.ju-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }

.ju-card, .ju-fixture, .ju-panel, .ju-suite {
  background: var(--ju-surface);
  border: 1px solid var(--ju-border);
  border-radius: var(--ju-radius);
  padding: 16px;
}
.ju-card-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ju-card-head h4 { margin: 0; font-size: 1rem; }
.ju-card { margin: 0; }

.ju-suite[data-suite] { border-left: 4px solid var(--ju-accent); }
.ju-suite-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; justify-content: space-between; }
.ju-suite-head h3 { margin: 0; font-size: 1.1rem; }

.ju-badge, .ju-chip, .ju-flag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--ju-border);
  background: var(--ju-surface-2);
  white-space: nowrap;
}
.ju-chip-kind { text-transform: capitalize; }
.ju-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 0; }

/* Operational status colors are conveyed by text + a left bar, never color alone. */
.ju-badge[data-status], .ju-flag[data-status] { border-left-width: 4px; }
[data-status="ready"] { border-left-color: var(--jami-color-brand-teal); }
[data-status="empty"], [data-status="loading"] { border-left-color: var(--ju-muted); }
[data-status="stale"] { border-left-color: #b58a2e; }
[data-status="redacted"], [data-status="denied"] { border-left-color: var(--jami-color-brand-accent); }
[data-status="error"], [data-status="missing-source"], [data-status="unsupported"] { border-left-color: #b3402f; }
.ju-badge[data-state="renderable"] { border-left: 4px solid var(--jami-color-brand-teal); }
.ju-badge[data-state="invalid"], .ju-badge[data-state="error"], .ju-badge[data-state="unsupported"] { border-left: 4px solid #b3402f; }
.ju-badge[data-state="denied"] { border-left: 4px solid var(--jami-color-brand-accent); }
.ju-badge[data-state="display-only"] { border-left: 4px solid var(--ju-muted); }

.ju-pending {
  display: inline-block;
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--ju-fg) 8%, var(--ju-bg));
  color: var(--ju-muted);
  border: 1px dashed var(--ju-border);
}

.ju-btn {
  font: inherit;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: var(--ju-radius);
  border: 1px solid var(--ju-accent);
  background: var(--ju-accent);
  color: var(--ju-bg);
  cursor: pointer;
}
.ju-btn[data-variant="default"] { background: var(--ju-surface-2); color: var(--ju-fg); border-color: var(--ju-border); }

.ju-notice {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: var(--ju-radius);
  border: 1px solid var(--ju-border);
  font-size: 0.9rem;
}
.ju-notice[data-tone="warning"] { border-left: 4px solid #b58a2e; }
.ju-notice[data-tone="danger"] { border-left: 4px solid #b3402f; }
.ju-notice-code { display: inline-block; margin-left: 6px; font-family: ui-monospace, monospace; opacity: 0.8; }

.ju-fixture-head, .ju-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.ju-fixture-id, .ju-panel-id { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.8rem; }
.ju-panel-kind { margin-left: 8px; color: var(--ju-muted); font-size: 0.8rem; }
.ju-fixture-body, .ju-panel-body { margin-top: 12px; }

.ju-kv-grid { display: grid; gap: 6px 14px; margin: 0; }
.ju-kv { display: grid; grid-template-columns: minmax(120px, 38%) 1fr; gap: 8px; align-items: start; }
.ju-kv dt { color: var(--ju-muted); font-size: 0.82rem; }
.ju-kv dd { margin: 0; }
/* Long hashes, ids, and free text wrap instead of overflowing. */
.ju-kv dd, .ju-value, code, .ju-fixture-id, .ju-panel-id { overflow-wrap: anywhere; word-break: break-word; }
.ju-kv-list { margin: 0; padding-left: 18px; }
.ju-muted { color: var(--ju-muted); }
.ju-reasons { margin-top: 10px; font-size: 0.85rem; }
.ju-reasons summary { cursor: pointer; color: var(--ju-muted); }

table.ju-tokens { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
table.ju-tokens th, table.ju-tokens td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--ju-border); vertical-align: middle; }
.ju-swatch { width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--ju-border); display: inline-block; vertical-align: middle; }
.ju-pass { color: var(--jami-color-brand-teal); font-weight: 600; }
.ju-fail { color: #b3402f; font-weight: 600; }

footer.ju-footer { border-top: 1px solid var(--ju-border); margin-top: 40px; padding-top: 18px; color: var(--ju-muted); font-size: 0.85rem; }
footer.ju-footer code { overflow-wrap: anywhere; }

/* Honor reduced-motion: remove all transitions and animations. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}

/* Single-column layout on narrow viewports. */
@media (max-width: 640px) {
  .ju-grid { grid-template-columns: 1fr; }
  .ju-kv { grid-template-columns: 1fr; }
}
`.trim();
}

// --- sections ----------------------------------------------------------------

function header(theme) {
  const buttons = THEMES.map(
    (name) =>
      `<button type="button" class="ju-theme-btn" data-theme-value="${name}" aria-pressed="${
        name === theme ? "true" : "false"
      }">${escapeHtml(THEME_LABEL[name])}</button>`,
  ).join("");
  return `
<header class="ju-header">
  <h1>Studio UI Workbench Showcase</h1>
  <p>A browser-renderable surface over the accepted Stream 5 seams: the generated Jami factory theme, the generated registry and suite descriptors, the resident renderer, and the workbench presentation seam. Policy, tool execution, memory, and provenance stay owned by Jami Harness; this surface only displays and configures.</p>
  <div class="ju-toolbar" role="group" aria-label="Theme">
    <span class="ju-toolbar-label" id="ju-theme-label">Theme</span>
    ${buttons}
  </div>
</header>`;
}

function nav(suites) {
  const suiteLinks = suites
    .map((s) => `<li><a href="#suite-${escapeAttr(s.lane)}">${escapeHtml(SUITE_TITLE[s.lane] ?? s.lane)}</a></li>`)
    .join("");
  return `
<nav class="ju-nav" aria-label="Sections">
  <ul>
    ${suiteLinks}
    <li><a href="#renderer">Resident renderer</a></li>
    <li><a href="#workbench">Workbench panels</a></li>
    <li><a href="#tokens">Theme tokens</a></li>
  </ul>
</nav>`;
}

function memberRow(member) {
  const state =
    member.sourceState === "installable"
      ? `<span class="ju-badge" data-status="ready">installable</span>`
      : `<span class="ju-pending">${escapeHtml(member.sourceState)}</span>`;
  return `<li><code>${escapeHtml(member.name)}</code> <span class="ju-muted">${escapeHtml(
    member.type ?? "",
  )} · v${escapeHtml(member.version ?? "?")}</span> ${state}</li>`;
}

function suiteSection({ lane, manifest, item, members }, { primary }) {
  const planned = (manifest.plannedSurfaces ?? [])
    .map((s) => `<span class="ju-pending">${escapeHtml(s)}</span>`)
    .join(" ");
  const heading = primary
    ? `<span class="ju-badge" data-status="ready">live route</span>`
    : `<span class="ju-pending">descriptor only · app shell pending</span>`;
  const description = item?.description ?? "";
  return `
<article class="ju-suite" id="suite-${escapeAttr(lane)}" data-suite="${escapeAttr(lane)}">
  <div class="ju-suite-head">
    <h3>${escapeHtml(SUITE_TITLE[lane] ?? lane)} <span class="ju-muted">(${escapeHtml(lane)})</span></h3>
    ${heading}
  </div>
  <p class="ju-muted">${escapeHtml(description)}</p>
  <dl class="ju-kv-grid">
    <div class="ju-kv"><dt>manifest</dt><dd><code>@jami-studio/${escapeHtml(lane)}-suite</code></dd></div>
    <div class="ju-kv"><dt>schema version</dt><dd><code>${escapeHtml(manifest.schemaVersion ?? "")}</code></dd></div>
  </dl>
  <h4>Installed registry items</h4>
  <ul class="ju-kv-list">${members.map(memberRow).join("")}</ul>
  <h4>Planned surfaces <span class="ju-muted">(pending Workstream 4 vocabulary — not installed)</span></h4>
  <div class="ju-chips">${planned}</div>
</article>`;
}

function suitesSection(suites) {
  const solo = suites.find((s) => s.lane === "solo");
  const others = suites.filter((s) => s.lane !== "solo");
  return `
<section class="ju-section" aria-labelledby="ju-suites-h">
  <h2 id="ju-suites-h">Suite lanes</h2>
  <p class="ju-lead">The <code>solo</code> lane has a live route that reads its generated manifest and resolves each member to real registry metadata. The other lanes are honest descriptor-only states until their per-lane vocabulary lands.</p>
  ${suiteSection(solo, { primary: true })}
  <div class="ju-grid" style="margin-top:16px">
    ${others.map((s) => suiteSection(s, { primary: false })).join("")}
  </div>
</section>`;
}

function rendererSection(compatFixtures) {
  // Order: renderable first, then display-only references, then fail-closed.
  const order = { renderable: 0, "display-only": 1, denied: 2, unsupported: 3, invalid: 4, error: 5 };
  const sorted = [...compatFixtures].sort(
    (a, b) => (order[a.rendered.state] ?? 9) - (order[b.rendered.state] ?? 9),
  );
  return `
<section class="ju-section" id="renderer" aria-labelledby="ju-renderer-h">
  <h2 id="ju-renderer-h">Resident renderer</h2>
  <p class="ju-lead" id="ju-display-only-note">Each card is a real renderer-produced render tree for a checked compatibility fixture. Valid payloads render resident components; action references render display-only (executable: false); unknown, unsafe, or malformed payloads fail closed to an inert fallback.</p>
  <div class="ju-grid">
    ${sorted.map(renderCompatCard).join("")}
  </div>
</section>`;
}

function workbenchSection(panels) {
  return `
<section class="ju-section" id="workbench" aria-labelledby="ju-workbench-h">
  <h2 id="ju-workbench-h">Workbench presentation panels</h2>
  <p class="ju-lead">Harness-originated refs (artifact views, evidence packets, run-event traces, memory records, context packs, action refs) presented through the workbench seam as inert operational descriptors. Redaction, freshness, and denial are displayed, never decided here.</p>
  <div class="ju-grid">
    ${panels.map(renderPresentationPanel).join("")}
  </div>
</section>`;
}

// Contrast pairs evidenced in the page (computed from the generated token hex).
const CONTRAST_PAIRS = [
  { label: "Light text on light background", fgVar: "--jami-semantic-light-foreground", bgVar: "--jami-semantic-light-background", min: 4.5, level: "AA text" },
  { label: "Dark text on dark background", fgVar: "--jami-semantic-dark-foreground", bgVar: "--jami-semantic-dark-background", min: 4.5, level: "AA text" },
  { label: "Accent on light background", fgVar: "--jami-semantic-light-accent", bgVar: "--jami-semantic-light-background", min: 3.0, level: "AA UI/large" },
  { label: "Focus ring on light background", fgVar: "--jami-componentState-focusRing", bgVar: "--jami-semantic-light-background", min: 3.0, level: "AA non-text" },
];

function tokenValue(tokens, name) {
  return tokens.find((t) => t.name === name)?.value ?? null;
}

export function computeContrastRows(tokens) {
  return CONTRAST_PAIRS.map((pair) => {
    const fg = tokenValue(tokens, pair.fgVar);
    const bg = tokenValue(tokens, pair.bgVar);
    const ratio = contrastRatio(fg, bg);
    return { ...pair, fg, bg, ratio, pass: ratio !== null && ratio >= pair.min };
  });
}

function tokensSection(tokens) {
  const colorTokens = tokens.filter((t) => /^#[0-9a-fA-F]{6}$/.test(t.value));
  const swatches = colorTokens
    .map(
      (t) =>
        `<tr><td><span class="ju-swatch" style="background:${escapeAttr(t.value)}"></span></td><td><code>${escapeHtml(
          t.name,
        )}</code></td><td><code>${escapeHtml(t.value)}</code></td></tr>`,
    )
    .join("");
  const contrastRows = computeContrastRows(tokens)
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td><td><code>${escapeHtml(row.fg ?? "?")}</code> on <code>${escapeHtml(
          row.bg ?? "?",
        )}</code></td><td>${row.ratio ?? "—"}:1</td><td>${escapeHtml(row.level)}</td><td class="${
          row.pass ? "ju-pass" : "ju-fail"
        }">${row.pass ? "PASS" : "CHECK"}</td></tr>`,
    )
    .join("");
  return `
<section class="ju-section" id="tokens" aria-labelledby="ju-tokens-h">
  <h2 id="ju-tokens-h">Theme tokens</h2>
  <p class="ju-lead">Color tokens and computed WCAG contrast ratios, read straight from <code>packages/tokens/generated/jami.css</code>.</p>
  <h3>Color tokens</h3>
  <table class="ju-tokens"><caption class="ju-muted" style="text-align:left">Generated color variables</caption>
    <thead><tr><th scope="col">Swatch</th><th scope="col">Token</th><th scope="col">Value</th></tr></thead>
    <tbody>${swatches}</tbody>
  </table>
  <h3 style="margin-top:24px">Contrast checks</h3>
  <table class="ju-tokens">
    <thead><tr><th scope="col">Pair</th><th scope="col">Colors</th><th scope="col">Ratio</th><th scope="col">Target</th><th scope="col">Result</th></tr></thead>
    <tbody>${contrastRows}</tbody>
  </table>
</section>`;
}

function footer(data) {
  return `
<footer class="ju-footer">
  <p>Generated by <code>node apps/workbench/build.mjs</code> from generated artifacts and the checked fixture corpus. No remote registry fetch, package-manager install, provider runtime, or harness execution is performed.</p>
  <p>Sources: <code>packages/tokens/generated/jami.css</code> · <code>packages/registry/generated/registry.json</code> · <code>packages/registry/generated/suites/*.suite.json</code> · <code>packages/renderer/fixtures/compatibility/*</code> · <code>packages/renderer/fixtures/presentation/*</code>.</p>
  <p>Pending: per-lane suite vocabulary (pages/blocks/components), full suite app shells, and harness runtime — none are claimed here.</p>
</footer>`;
}

// Theme switcher: first-party app-shell script (not a renderer payload). It only
// toggles the document theme attribute and the pressed state; it wires no
// network, storage, or action behavior.
const THEME_SCRIPT = `
(function () {
  var root = document.documentElement;
  var buttons = document.querySelectorAll('.ju-theme-btn');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-theme-value');
      root.setAttribute('data-theme', value);
      buttons.forEach(function (other) {
        other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
      });
    });
  });
})();
`.trim();

export function buildPage(data, { theme = "factory", focusFirst = false } = {}) {
  const body = [
    `<a class="ju-skip" href="#ju-main">Skip to content</a>`,
    `<div class="ju-shell">`,
    header(theme),
    nav(data.suites),
    `<main id="ju-main">`,
    suitesSection(data.suites),
    rendererSection(data.compatFixtures),
    workbenchSection(data.presentationPanels),
    tokensSection(data.tokens),
    `</main>`,
    footer(data),
    `</div>`,
  ].join("\n");

  // `focusFirst` adds autofocus to the first theme control so the headless
  // screenshot run captures the real `:focus-visible` ring as keyboard evidence.
  const withFocus = focusFirst
    ? body.replace('class="ju-theme-btn"', 'class="ju-theme-btn" autofocus')
    : body;

  return `<!doctype html>
<html lang="en" data-theme="${escapeAttr(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Studio UI Workbench Showcase</title>
<style>${styles(data.tokenCss)}</style>
</head>
<body>
${withFocus}
<script>${THEME_SCRIPT}</script>
</body>
</html>
`;
}

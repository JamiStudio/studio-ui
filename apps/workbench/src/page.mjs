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
import { buildWorkbenchClientScript } from "./workbench-client.mjs";

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
:root {
  --ju-surface: color-mix(in srgb, var(--ju-fg) 4%, var(--ju-bg));
  --ju-surface-2: color-mix(in srgb, var(--ju-fg) 8%, var(--ju-bg));
  --ju-border: color-mix(in srgb, var(--ju-fg) 18%, var(--ju-bg));
  --ju-muted: color-mix(in srgb, var(--ju-fg) 52%, var(--ju-bg));
  --ju-status-success: var(--jami-color-brand-teal);
  --ju-status-warning: color-mix(in srgb, var(--ju-accent) 58%, var(--jami-color-brand-teal));
  --ju-status-danger: var(--ju-accent);
  --ju-radius: var(--jami-radius-control, 8px);
  --ju-gap: var(--jami-spacing-control, 8px);
  --ju-motion: var(--jami-motion-fast, 120ms);
  --ju-dock-width: var(--jami-shell-dockWidth, 320px);
  --ju-density: var(--jami-density-comfortable, 1);
  --ju-font-size: 16px;
}

* { box-sizing: border-box; min-width: 0; }
html, body { margin: 0; max-width: 100%; overflow-x: hidden; padding: 0; width: 100%; }
body {
  background: var(--ju-bg);
  color: var(--ju-fg);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: var(--ju-font-size);
  line-height: 1.5;
  min-height: 100vh;
}

a { color: var(--ju-accent); }
p, h1, h2, h3, h4 { max-width: 100%; overflow-wrap: anywhere; }

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

.ju-shell { max-width: 1180px; margin: 0 auto; min-width: 0; overflow-x: hidden; padding: clamp(16px, 4vw, 40px); width: 100%; }
body:not([data-workbench-closed]) .ju-shell { padding-bottom: 96px; }

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

.ju-open-workbench {
  bottom: 14px;
  display: none;
  position: fixed;
  right: 14px;
  z-index: 20;
}
body[data-workbench-closed] .ju-open-workbench { display: inline-flex; }
body:not([data-workbench-closed]) .ju-open-workbench { display: none; }

.ju-workbench {
  background: var(--ju-surface);
  border-top: 1px solid var(--ju-border);
  bottom: 0;
  box-shadow: 0 -8px 24px color-mix(in srgb, var(--ju-fg) 10%, transparent);
  color: var(--ju-fg);
  display: grid;
  gap: 0;
  left: 0;
  max-height: min(58vh, 520px);
  overflow: hidden;
  position: fixed;
  right: 0;
  z-index: 15;
}
body[data-workbench-closed] .ju-workbench { display: none; }
.ju-statusbar {
  align-items: center;
  border-bottom: 1px solid var(--ju-border);
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(150px, 1.2fr) minmax(140px, 1fr) auto auto auto auto auto auto auto auto;
  min-height: 48px;
  padding: 8px 12px;
}
.ju-status-item {
  display: grid;
  gap: 1px;
  min-width: 0;
}
.ju-status-label {
  color: var(--ju-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}
.ju-status-value {
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ju-tool-btn {
  align-items: center;
  background: var(--ju-surface-2);
  border: 1px solid var(--ju-border);
  border-radius: var(--ju-radius);
  color: var(--ju-fg);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  justify-content: center;
  min-height: 32px;
  min-width: 64px;
  padding: 5px 10px;
}
.ju-tool-btn[data-primary="true"] {
  background: var(--ju-accent);
  border-color: var(--ju-accent);
  color: var(--ju-bg);
}
.ju-dock {
  align-items: start;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(220px, var(--ju-dock-width));
  gap: 8px;
  overflow-x: auto;
  padding: 10px 12px 12px;
}
.ju-dock-panel {
  background: var(--ju-bg);
  border: 1px solid var(--ju-border);
  border-radius: var(--ju-radius);
  min-width: 0;
  overflow: hidden;
}
.ju-dock-panel summary {
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 800;
  list-style: none;
  padding: 9px 10px;
}
.ju-dock-panel summary::-webkit-details-marker { display: none; }
.ju-dock-body {
  border-top: 1px solid var(--ju-border);
  display: grid;
  gap: 10px;
  max-height: 260px;
  overflow: auto;
  padding: 10px;
}
.ju-control {
  display: grid;
  gap: 4px;
}
.ju-control label, .ju-control span {
  color: var(--ju-muted);
  font-size: 0.72rem;
  font-weight: 700;
}
.ju-control input, .ju-control select, .ju-control textarea {
  background: var(--ju-surface);
  border: 1px solid var(--ju-border);
  border-radius: var(--ju-radius);
  color: var(--ju-fg);
  font: inherit;
  min-height: 32px;
  padding: 5px 8px;
  width: 100%;
}
.ju-control input[type="color"] { padding: 2px; }
.ju-control textarea {
  min-height: 112px;
  resize: vertical;
}
.ju-mini-list {
  display: grid;
  gap: 5px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.ju-mini-list li {
  border: 1px solid var(--ju-border);
  border-radius: var(--ju-radius);
  font-size: 0.76rem;
  overflow-wrap: anywhere;
  padding: 6px;
}

nav.ju-nav { margin: 20px 0; }
nav.ju-nav ul { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; margin: 0; padding: 0; }
nav.ju-nav li { min-width: 0; }
nav.ju-nav a {
  text-decoration: none;
  padding: 6px 12px;
  border: 1px solid var(--ju-border);
  border-radius: 999px;
  background: var(--ju-surface);
  color: var(--ju-fg);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

section.ju-section { margin: 36px 0; }
.ju-section > h2 { font-size: 1.3rem; margin: 0 0 4px; }
.ju-section > p.ju-lead { margin: 0 0 18px; color: var(--ju-muted); max-width: 70ch; }

.ju-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); min-width: 0; }

.ju-card, .ju-fixture, .ju-panel, .ju-suite {
  background: var(--ju-surface);
  border: 1px solid var(--ju-border);
  border-radius: var(--ju-radius);
  min-width: 0;
  overflow-wrap: anywhere;
  padding: 16px;
}
.ju-card-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ju-card-head h4 { margin: 0; font-size: 1rem; }
.ju-card { margin: 0; }

.ju-brand-card {
  display: grid;
  gap: 12px;
}
.ju-brand-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ju-swatch-row {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.ju-large-swatch {
  border: 1px solid var(--ju-border);
  border-radius: var(--ju-radius);
  display: grid;
  min-height: 46px;
  padding: 6px;
}
.ju-large-swatch span {
  align-self: end;
  background: color-mix(in srgb, var(--ju-bg) 86%, transparent);
  border-radius: 4px;
  color: var(--ju-fg);
  font-size: 0.68rem;
  font-weight: 700;
  overflow-wrap: anywhere;
  padding: 2px 4px;
}

.ju-suite[data-suite] { border-left: 4px solid var(--ju-accent); }
.ju-suite-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; justify-content: flex-start; min-width: 0; }
.ju-suite-head h3 { margin: 0; min-width: 0; overflow-wrap: anywhere; font-size: 1.1rem; }
.ju-route-list, .ju-block-list { display: grid; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
.ju-member-row { display: grid; gap: 2px; margin-bottom: 6px; min-width: 0; }
.ju-member-meta { color: var(--ju-muted); font-size: 0.82rem; overflow-wrap: anywhere; }
.ju-route-list li, .ju-block-list li {
  border: 1px solid var(--ju-border);
  border-radius: var(--ju-radius);
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  padding: 10px;
}
.ju-route-title, .ju-block-title { display: flex; align-items: baseline; justify-content: flex-start; gap: 8px; flex-wrap: wrap; min-width: 0; }
.ju-route-title strong, .ju-block-title strong { min-width: 0; overflow-wrap: anywhere; }
.ju-route-path { color: var(--ju-muted); font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.78rem; overflow-wrap: anywhere; }

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
[data-status="ready"] { border-left-color: var(--ju-status-success); }
[data-status="empty"], [data-status="loading"] { border-left-color: var(--ju-muted); }
[data-status="stale"] { border-left-color: var(--ju-status-warning); }
[data-status="redacted"], [data-status="denied"] { border-left-color: var(--jami-color-brand-accent); }
[data-status="error"], [data-status="missing-source"], [data-status="unsupported"] { border-left-color: var(--ju-status-danger); }
.ju-badge[data-state="renderable"] { border-left: 4px solid var(--ju-status-success); }
.ju-badge[data-state="invalid"], .ju-badge[data-state="error"], .ju-badge[data-state="unsupported"] { border-left: 4px solid var(--ju-status-danger); }
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
.ju-notice[data-tone="warning"] { border-left: 4px solid var(--ju-status-warning); }
.ju-notice[data-tone="danger"] { border-left: 4px solid var(--ju-status-danger); }
.ju-notice-code { display: inline-block; margin-left: 6px; font-family: ui-monospace, monospace; opacity: 0.8; }

.ju-fixture-head, .ju-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.ju-fixture-id, .ju-panel-id { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.8rem; }
.ju-panel-kind { margin-left: 8px; color: var(--ju-muted); font-size: 0.8rem; }
.ju-fixture-body, .ju-panel-body { margin-top: 12px; }

.ju-kv-grid { display: grid; gap: 6px 14px; margin: 0; }
.ju-kv { display: grid; grid-template-columns: minmax(120px, 38%) minmax(0, 1fr); gap: 8px; align-items: start; min-width: 0; }
.ju-kv dt { color: var(--ju-muted); font-size: 0.82rem; }
.ju-kv dd { margin: 0; min-width: 0; }
/* Long hashes, ids, and free text wrap instead of overflowing. */
.ju-kv dd, .ju-value, code, .ju-fixture-id, .ju-panel-id { overflow-wrap: anywhere; white-space: normal; word-break: break-word; }
.ju-kv-list { margin: 0; padding-left: 18px; }
.ju-kv-list li { min-width: 0; overflow-wrap: anywhere; }
.ju-muted { color: var(--ju-muted); }
.ju-reasons { margin-top: 10px; font-size: 0.85rem; }
.ju-reasons summary { cursor: pointer; color: var(--ju-muted); }

table.ju-tokens { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
table.ju-tokens th, table.ju-tokens td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--ju-border); vertical-align: middle; }
.ju-swatch { width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--ju-border); display: inline-block; vertical-align: middle; }
.ju-pass { color: var(--jami-color-brand-teal); font-weight: 600; }
.ju-fail { color: var(--ju-status-danger); font-weight: 600; }

footer.ju-footer { border-top: 1px solid var(--ju-border); margin-top: 40px; padding-top: 18px; color: var(--ju-muted); font-size: 0.85rem; }
footer.ju-footer code { overflow-wrap: anywhere; }

/* Honor reduced-motion: remove all transitions and animations. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}

/* Single-column layout on narrow viewports. */
@media (max-width: 640px) {
  .ju-shell { padding: 12px; }
  .ju-grid { grid-template-columns: minmax(0, 1fr); }
  .ju-kv { grid-template-columns: 1fr; }
  .ju-card, .ju-fixture, .ju-panel, .ju-suite { padding: 12px; }
  .ju-badge, .ju-chip, .ju-flag { max-width: 100%; white-space: normal; }
  nav.ju-nav ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
  nav.ju-nav a { display: block; max-width: 100%; text-align: center; white-space: normal; width: 100%; }
  .ju-statusbar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ju-tool-btn { min-width: 0; width: 100%; }
  .ju-dock { grid-auto-columns: minmax(220px, 84vw); }
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

function tokenValue(tokens, name) {
  return tokens.find((t) => t.name === name)?.value ?? null;
}

function workbenchOverlay(data) {
  const colorControls = [
    ["accent", "Accent", tokenValue(data.tokens, "--jami-semantic-light-accent")],
    ["focusRing", "Focus", tokenValue(data.tokens, "--jami-componentState-focusRing")],
  ]
    .map(
      ([name, label, value]) =>
        `<div class="ju-control"><label for="ju-wb-${name}">${escapeHtml(label)}</label><input id="ju-wb-${name}" data-wb-control="${escapeAttr(
          name,
        )}" type="color" value="${escapeAttr(value ?? "")}" /></div>`,
    )
    .join("");
  const registryItems = data.registry.items
    .slice(0, 9)
    .map((item) => `<li><code>${escapeHtml(item.name)}</code> ${escapeHtml(item.type)}</li>`)
    .join("");
  const components = data.registry.items
    .filter((item) => item.type === "registry:ui" || item.type === "registry:component")
    .map((item) => `<li><code>${escapeHtml(item.name)}</code> ${escapeHtml(item.title ?? "")}</li>`)
    .join("");
  const suites = data.suites
    .map((suite) => `<li><code>${escapeHtml(suite.lane)}</code> ${escapeHtml(suite.manifest.shell?.title ?? suite.lane)}</li>`)
    .join("");
  const brandOptions = data.brandOptions
    .map(
      (option) =>
        `<button type="button" class="ju-theme-btn" data-brand-option="${escapeAttr(option.descriptor.optionId)}">${escapeHtml(
          option.descriptor.title,
        )}</button>`,
    )
    .join("");
  return `
<button type="button" class="ju-tool-btn ju-open-workbench" data-wb-action="open">Workbench</button>
<aside class="ju-workbench" aria-label="Always-live workbench overlay">
  <div class="ju-statusbar">
    <div class="ju-status-item"><span class="ju-status-label">Target</span><span class="ju-status-value" id="ju-wb-target">suite.solo</span></div>
    <div class="ju-status-item"><span class="ju-status-label">Theme</span><span class="ju-status-value" id="ju-wb-theme">Jami factory / factory</span></div>
    <div class="ju-status-item"><span class="ju-status-label">State</span><span class="ju-status-value" id="ju-wb-dirty">saved</span></div>
    <div class="ju-status-item"><span class="ju-status-label">Store</span><span class="ju-status-value" id="ju-wb-storage">local draft</span></div>
    <button type="button" class="ju-tool-btn" data-primary="true" data-wb-action="save">Save</button>
    <button type="button" class="ju-tool-btn" data-wb-action="duplicate">Duplicate</button>
    <button type="button" class="ju-tool-btn" data-wb-action="restore">Restore</button>
    <button type="button" class="ju-tool-btn" data-wb-action="register">Register</button>
    <button type="button" class="ju-tool-btn" data-wb-action="export">Export</button>
    <button type="button" class="ju-tool-btn" data-wb-action="close">Close</button>
  </div>
  <div class="ju-dock" aria-label="Workbench panels">
    <details class="ju-dock-panel" open><summary>Theme</summary><div class="ju-dock-body">
      <div class="ju-control"><span>Preset</span><div class="ju-chips">${THEMES.map(
        (name) => `<button type="button" class="ju-theme-btn" data-theme-value="${name}" aria-pressed="${name === "factory" ? "true" : "false"}">${escapeHtml(THEME_LABEL[name])}</button>`,
      ).join("")}</div></div>
      <div class="ju-control"><span>Brand options</span><div class="ju-chips">${brandOptions}</div></div>
      <div class="ju-control"><span>Last action</span><code id="ju-wb-last-action">ready</code></div>
    </div></details>
    <details class="ju-dock-panel" open><summary>Color</summary><div class="ju-dock-body">${colorControls}</div></details>
    <details class="ju-dock-panel"><summary>Typography</summary><div class="ju-dock-body">
      <div class="ju-control"><label for="ju-wb-fontSize">Body size</label><input id="ju-wb-fontSize" data-wb-control="fontSize" type="range" min="14" max="18" step="1" value="16" /></div>
      <div class="ju-control"><span>Token</span><code>--jami-typography-body</code></div>
    </div></details>
    <details class="ju-dock-panel"><summary>Layout</summary><div class="ju-dock-body">
      <div class="ju-control"><label for="ju-wb-spacing">Spacing</label><input id="ju-wb-spacing" data-wb-control="spacing" type="range" min="6" max="14" step="1" value="8" /></div>
      <div class="ju-control"><label for="ju-wb-radius">Radius</label><input id="ju-wb-radius" data-wb-control="radius" type="range" min="4" max="8" step="1" value="8" /></div>
      <div class="ju-control"><label for="ju-wb-dockWidth">Dock width</label><input id="ju-wb-dockWidth" data-wb-control="dockWidth" type="range" min="240" max="420" step="20" value="320" /></div>
    </div></details>
    <details class="ju-dock-panel"><summary>Surfaces</summary><div class="ju-dock-body"><ul class="ju-mini-list">${suites}</ul></div></details>
    <details class="ju-dock-panel"><summary>Components</summary><div class="ju-dock-body"><ul class="ju-mini-list">${components}</ul></div></details>
    <details class="ju-dock-panel"><summary>Charts</summary><div class="ju-dock-body"><ul class="ju-mini-list"><li>no chart registry items in current generated registry</li></ul></div></details>
    <details class="ju-dock-panel"><summary>Motion</summary><div class="ju-dock-body">
      <div class="ju-control"><label for="ju-wb-motion">Fast motion</label><input id="ju-wb-motion" data-wb-control="motion" type="range" min="0" max="240" step="20" value="120" /></div>
      <div class="ju-control"><label for="ju-wb-density">Density</label><input id="ju-wb-density" data-wb-control="density" type="range" min="0.85" max="1.2" step="0.05" value="1" /></div>
    </div></details>
    <details class="ju-dock-panel"><summary>Assets</summary><div class="ju-dock-body"><ul class="ju-mini-list"><li>generated suite manifests: ${escapeHtml(data.suites.length)}</li><li>presentation fixtures: ${escapeHtml(data.presentationPanels.length)}</li></ul></div></details>
    <details class="ju-dock-panel"><summary>Registry</summary><div class="ju-dock-body"><ul class="ju-mini-list">${registryItems}</ul><ul class="ju-mini-list" id="ju-wb-registered"></ul><div class="ju-control"><label for="ju-wb-export">Export artifact</label><textarea id="ju-wb-export" readonly></textarea></div></div></details>
  </div>
</aside>`;
}

function nav(suites) {
  const suiteLinks = suites
    .map((s) => `<li><a href="#suite-${escapeAttr(s.lane)}">${escapeHtml(SUITE_TITLE[s.lane] ?? s.lane)}</a></li>`)
    .join("");
  return `
<nav class="ju-nav" aria-label="Sections">
  <ul>
    ${suiteLinks}
    <li><a href="#brand-options">Default kit options</a></li>
    <li><a href="#vocabulary">Vocabulary schema</a></li>
    <li><a href="#renderer">Resident renderer</a></li>
    <li><a href="#workbench">Workbench panels</a></li>
    <li><a href="#tokens">Theme tokens</a></li>
  </ul>
</nav>`;
}

function brandOptionMap(brandOptions) {
  return Object.fromEntries(
    brandOptions.map((option) => [
      option.descriptor.optionId,
      {
        title: option.descriptor.title,
        workbenchControls: option.descriptor.workbenchControls,
      },
    ]),
  );
}

function brandSwatch(tokenDeltas, tokenName) {
  const value = tokenDeltas?.[tokenName];
  if (!/^#[0-9a-fA-F]{6}$/.test(value ?? "")) return "";
  return `<div class="ju-large-swatch" style="background:${escapeAttr(value)}"><span>${escapeHtml(tokenName.replace("semantic.", "").replace("componentState.", ""))}</span></div>`;
}

function brandOptionCard(option) {
  const descriptor = option.descriptor;
  const swatches = [
    brandSwatch(descriptor.tokenDeltas, "semantic.light.accent"),
    brandSwatch(descriptor.tokenDeltas, "semantic.dark.accent"),
    brandSwatch(descriptor.tokenDeltas, "componentState.focusRing"),
  ].join("");
  const bestFor = (descriptor.presentation?.bestFor ?? [])
    .map((item) => `<span class="ju-chip">${escapeHtml(item)}</span>`)
    .join("");
  const risks = (descriptor.presentation?.risks ?? []).map((risk) => `<li>${escapeHtml(risk)}</li>`).join("");
  const tokenDeltas = Object.entries(descriptor.tokenDeltas ?? {})
    .map(([name, value]) => `<li><code>${escapeHtml(name)}</code> -> <code>${escapeHtml(value)}</code></li>`)
    .join("");
  return `
<article class="ju-card ju-brand-card">
  <header class="ju-card-head">
    <h4>${escapeHtml(descriptor.title)}</h4>
    <span class="ju-badge" data-status="ready">selectable</span>
  </header>
  <p class="ju-muted">${escapeHtml(descriptor.summary)}</p>
  <div class="ju-swatch-row" aria-label="${escapeAttr(descriptor.title)} token delta swatches">${swatches}</div>
  <dl class="ju-kv-grid">
    <div class="ju-kv"><dt>registry item</dt><dd><code>${escapeHtml(option.itemName)}</code></dd></div>
    <div class="ju-kv"><dt>default kit role</dt><dd>${escapeHtml(descriptor.defaultKitRole)}</dd></div>
    <div class="ju-kv"><dt>brand canon</dt><dd>${descriptor.canonicalBrand ? "final" : "not final canon"}</dd></div>
    <div class="ju-kv"><dt>seed use</dt><dd>${escapeHtml(descriptor.seedMaterial?.usage ?? "")}</dd></div>
  </dl>
  <div class="ju-brand-actions">
    <button type="button" class="ju-tool-btn" data-primary="true" data-brand-option="${escapeAttr(descriptor.optionId)}">Select</button>
    <span class="ju-chip">CLI inspectable</span>
  </div>
  <details class="ju-reasons"><summary>Token deltas</summary><ul>${tokenDeltas}</ul></details>
  <details class="ju-reasons"><summary>Best fit</summary><div class="ju-chips">${bestFor}</div></details>
  <details class="ju-reasons"><summary>Open risks</summary><ul>${risks}</ul></details>
</article>`;
}

function brandOptionsSection(brandOptions) {
  return `
<section class="ju-section" id="brand-options" aria-labelledby="ju-brand-options-h">
  <h2 id="ju-brand-options-h">Default kit options</h2>
  <p class="ju-lead">Selectable brand/template descriptors generated through registry theme items. They express token deltas and workbench presentation choices against the accepted token model; none claims final brand canon or redistributes the exploratory logo source.</p>
  <div class="ju-grid">
    ${brandOptions.map(brandOptionCard).join("")}
  </div>
</section>`;
}

function memberRow(member) {
  const state =
    member.sourceState === "installable"
      ? `<span class="ju-badge" data-status="ready">installable</span>`
      : `<span class="ju-pending">${escapeHtml(member.sourceState)}</span>`;
  return `<li class="ju-member-row"><code>${escapeHtml(member.name)}</code><span class="ju-member-meta">${escapeHtml(
    member.type ?? "",
  )} · v${escapeHtml(member.version ?? "?")}</span>${state}</li>`;
}

function renderShell({ manifest }) {
  const shell = manifest.shell;
  if (!shell) {
    return `<p class="ju-notice" data-tone="warning">Suite shell source missing from generated manifest.</p>`;
  }
  const routes = (shell.routes ?? [])
    .map(
      (route) => `<li>
        <div class="ju-route-title"><strong>${escapeHtml(route.title)}</strong><code class="ju-route-path">${escapeHtml(route.path)}</code></div>
        <div class="ju-muted">${escapeHtml(route.page)} · ${(route.blocks ?? []).map((block) => escapeHtml(block)).join(", ")}</div>
      </li>`,
    )
    .join("");
  const blocks = (shell.blocks ?? [])
    .map(
      (block) => `<li>
        <div class="ju-block-title"><strong>${escapeHtml(block.title)}</strong><span class="ju-chip">${escapeHtml(block.component)}</span></div>
        <div class="ju-chips">${(block.stateExamples ?? [])
          .map((state) => `<span class="ju-flag" data-status="${state === "error" ? "error" : state === "empty" ? "empty" : "ready"}">${escapeHtml(state)}</span>`)
          .join("")}</div>
      </li>`,
    )
    .join("");
  const components = (shell.componentParts ?? [])
    .map((component) => `<span class="ju-chip">${escapeHtml(component)}</span>`)
    .join("");
  return `
  <dl class="ju-kv-grid">
    <div class="ju-kv"><dt>app shell</dt><dd><code>${escapeHtml(shell.appShell?.id ?? "")}</code> <span class="ju-muted">${escapeHtml(shell.appShell?.layout ?? "")}</span></dd></div>
    <div class="ju-kv"><dt>routes</dt><dd>${escapeHtml((shell.routes ?? []).length)}</dd></div>
    <div class="ju-kv"><dt>pages</dt><dd>${escapeHtml((shell.pages ?? []).length)}</dd></div>
    <div class="ju-kv"><dt>blocks</dt><dd>${escapeHtml((shell.blocks ?? []).length)}</dd></div>
  </dl>
  <h4>Route map</h4>
  <ul class="ju-route-list">${routes}</ul>
  <h4>Block and component parts</h4>
  <div class="ju-chips" aria-label="Resident component parts">${components}</div>
  <ul class="ju-block-list">${blocks}</ul>
  <h4>State coverage</h4>
  <dl class="ju-kv-grid">
    <div class="ju-kv"><dt>long content</dt><dd>${escapeHtml(shell.stateFixtures?.longContent ?? "")}</dd></div>
    <div class="ju-kv"><dt>empty</dt><dd>${escapeHtml(shell.stateFixtures?.empty ?? "")}</dd></div>
    <div class="ju-kv"><dt>error</dt><dd>${escapeHtml(shell.stateFixtures?.error ?? "")}</dd></div>
  </dl>`;
}

function suiteSection({ lane, manifest, item, members }) {
  const planned = (manifest.plannedSurfaces ?? [])
    .map((s) => `<span class="ju-pending">${escapeHtml(s)}</span>`)
    .join(" ");
  const heading = manifest.shell
    ? `<span class="ju-badge" data-status="ready">generated shell route</span>`
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
    <div class="ju-kv"><dt>install graph</dt><dd><code>${escapeHtml(manifest.installGraph?.root ?? "")}</code> -> ${escapeHtml((manifest.installGraph?.dependencies ?? []).join(", "))}</dd></div>
  </dl>
  <h4>Installed registry items</h4>
  <ul class="ju-kv-list">${members.map(memberRow).join("")}</ul>
  ${renderShell({ manifest })}
  <h4>Surface vocabulary <span class="ju-muted">(described in generated shell; React app implementation pending)</span></h4>
  <div class="ju-chips">${planned}</div>
</article>`;
}

function suitesSection(suites) {
  return `
<section class="ju-section" aria-labelledby="ju-suites-h">
  <h2 id="ju-suites-h">Suite lanes</h2>
  <p class="ju-lead">Each lane renders from its generated suite manifest, including app-shell navigation, route maps, page/block/component parts, install graph metadata, and long-content/empty/error states. These are authored shell descriptors, not a claim of a React app runtime.</p>
  <div class="ju-grid">
    ${suites.map((s) => suiteSection(s)).join("")}
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

function propSummary(schema) {
  return Object.entries(schema.properties ?? {})
    .map(([name, rule]) => {
      const type = rule.enum ? rule.enum.join(" | ") : rule.type;
      return `<span class="ju-chip"><code>${escapeHtml(name)}</code> ${escapeHtml(type)}</span>`;
    })
    .join("");
}

function vocabularyEvidenceSection(data) {
  const rows = data.componentVocabulary
    .map((definition) => {
      const descriptor = data.primitiveDescriptors[definition.name];
      return `
<article class="ju-card">
  <header class="ju-card-head">
    <h4>${escapeHtml(definition.name)}</h4>
    <span class="ju-badge" data-status="ready">${escapeHtml(definition.kind)}</span>
    <span class="ju-chip">${escapeHtml(descriptor?.implementationStatus ?? "missing descriptor")}</span>
  </header>
  <dl class="ju-kv-grid">
    <div class="ju-kv"><dt>registry item</dt><dd><code>${escapeHtml(definition.registryItem)}</code></dd></div>
    <div class="ju-kv"><dt>prop schema</dt><dd><code>${escapeHtml(definition.propSchema.schemaVersion)}</code></dd></div>
    <div class="ju-kv"><dt>element</dt><dd><code>${escapeHtml(descriptor?.element ?? "")}</code></dd></div>
    <div class="ju-kv"><dt>a11y role</dt><dd><code>${escapeHtml(definition.aria.role)}</code></dd></div>
  </dl>
  <div class="ju-chips" aria-label="${escapeAttr(definition.name)} prop schema">${propSummary(definition.propSchema)}</div>
</article>`;
    })
    .join("");
  return `
<section class="ju-section" id="vocabulary" aria-labelledby="ju-vocabulary-h">
  <h2 id="ju-vocabulary-h">Vocabulary schema</h2>
  <p class="ju-lead">Resident component prop schemas and React-style descriptors loaded from <code>packages/ui</code>. The renderer uses this handshake to reject stale vocabulary versions and unsupported props before it emits an inert render tree.</p>
  <dl class="ju-kv-grid ju-card">
    <div class="ju-kv"><dt>handshake</dt><dd><code>${escapeHtml(data.vocabularyHandshake.schemaVersion)}</code></dd></div>
    <div class="ju-kv"><dt>payload schemas</dt><dd>${data.vocabularyHandshake.payloadSchemaVersions.map((version) => `<code>${escapeHtml(version)}</code>`).join(" ")}</dd></div>
    <div class="ju-kv"><dt>prop schema</dt><dd><code>${escapeHtml(data.vocabularyHandshake.propSchemaVersion)}</code></dd></div>
    <div class="ju-kv"><dt>invalid props</dt><dd><code>${escapeHtml(data.vocabularyHandshake.generation.invalidPropState)}</code></dd></div>
    <div class="ju-kv"><dt>unsupported components</dt><dd><code>${escapeHtml(data.vocabularyHandshake.generation.unsupportedComponentState)}</code></dd></div>
  </dl>
  <div class="ju-grid" style="margin-top:16px">${rows}</div>
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
  <p>Pending: full React suite app implementations, hosted persistence, backend registration, and harness runtime — none are claimed here.</p>
</footer>`;
}

export function buildPage(data, { theme = "factory", focusFirst = false } = {}) {
  const body = [
    `<a class="ju-skip" href="#ju-main">Skip to content</a>`,
    `<div class="ju-shell">`,
    header(theme),
    nav(data.suites),
    `<main id="ju-main">`,
    suitesSection(data.suites),
    brandOptionsSection(data.brandOptions),
    vocabularyEvidenceSection(data),
    rendererSection(data.compatFixtures),
    workbenchSection(data.presentationPanels),
    tokensSection(data.tokens),
    `</main>`,
    footer(data),
    `</div>`,
    workbenchOverlay(data),
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
<script>${buildWorkbenchClientScript(brandOptionMap(data.brandOptions))}</script>
</body>
</html>
`;
}

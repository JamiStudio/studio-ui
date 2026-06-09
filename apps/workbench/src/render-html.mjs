// Serialize the resident renderer's inert render tree and the presentation
// seam's descriptors into static, escaped HTML.
//
// The input is always JSON-inert: the renderer has already dropped callbacks,
// event-handler props, HTML-like strings, and `javascript:` URLs. This module
// re-escapes every echoed value at the HTML boundary (defense in depth) and maps
// the small resident component vocabulary to safe, semantic markup. It never
// wires an event handler and never emits an executable control — a denied or
// display-only action renders as inert, labelled UI.

import { escapeAttr, escapeHtml } from "./escape.mjs";

// --- generic key/value rendering (presentation descriptor bodies) ------------

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function renderValue(value) {
  if (value === null || value === undefined) {
    return `<span class="ju-muted">—</span>`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return `<span class="ju-muted">none</span>`;
    const items = value.map((item) => `<li>${renderValue(item)}</li>`).join("");
    return `<ul class="ju-kv-list">${items}</ul>`;
  }
  if (isObject(value)) {
    return renderKeyValues(value);
  }
  return `<span class="ju-value">${escapeHtml(value)}</span>`;
}

function renderKeyValues(object) {
  const rows = Object.entries(object)
    .map(
      ([key, value]) =>
        `<div class="ju-kv"><dt>${escapeHtml(key)}</dt><dd>${renderValue(value)}</dd></div>`,
    )
    .join("");
  return `<dl class="ju-kv-grid">${rows}</dl>`;
}

// --- resident render-tree nodes ----------------------------------------------

function renderChildren(children) {
  return (children ?? []).map(renderNodeHtml).join("");
}

function renderElement(node) {
  const props = isObject(node.props) ? node.props : {};
  switch (node.component) {
    case "button": {
      // A real, focusable button element. It carries no handler: action wiring
      // is a harness-owned slot, surfaced here as inert data, never executed.
      const variant = escapeAttr(props.variant ?? "default");
      return `<button type="button" class="ju-btn" data-variant="${variant}" aria-describedby="ju-display-only-note">${renderChildren(node.children)}</button>`;
    }
    case "inline-notice": {
      const tone = escapeAttr(props.tone ?? "info");
      const role = tone === "danger" ? "alert" : "status";
      const code = props.code ? `<span class="ju-notice-code">${escapeHtml(props.code)}</span>` : "";
      return `<div class="ju-notice" data-tone="${tone}" role="${role}">${renderChildren(node.children)}${code}</div>`;
    }
    case "artifact-card": {
      const renderers = Array.isArray(node.renderers)
        ? node.renderers
            .map((r) => escapeHtml(r.mode ?? r.rendererId ?? "?"))
            .map((mode) => `<span class="ju-chip">${mode}</span>`)
            .join("")
        : "";
      return [
        `<article class="ju-card" aria-label="Artifact view">`,
        `<header class="ju-card-head"><span class="ju-chip ju-chip-kind">${escapeHtml(props.kind ?? "artifact")}</span><h4>${escapeHtml(props.title ?? "Artifact")}</h4></header>`,
        renderKeyValues({
          artifactViewId: props.artifactViewId ?? null,
          artifactId: props.artifactId ?? null,
          promotionState: props.promotionState ?? null,
        }),
        renderers ? `<div class="ju-chips" aria-label="Available renderer modes">${renderers}</div>` : "",
        `</article>`,
      ].join("");
    }
    case "action-slot": {
      const denial = node.denial
        ? `<div class="ju-notice" data-tone="danger" role="alert">Denied by harness policy${
            node.denial.reason ? `: ${escapeHtml(node.denial.reason)}` : ""
          }</div>`
        : "";
      return [
        `<article class="ju-card ju-action" aria-label="Action slot (display only)">`,
        `<header class="ju-card-head"><h4>${escapeHtml(props.label ?? "Action")}</h4></header>`,
        renderKeyValues({
          state: props.state ?? null,
          risk: props.risk ?? null,
          policyScope: props.policyScope ?? null,
          confirmationMode: props.confirmationMode ?? null,
          executable: node.action ? node.action.executable : false,
        }),
        denial,
        `</article>`,
      ].join("");
    }
    case "text":
    default:
      return `<span class="ju-text">${renderChildren(node.children)}</span>`;
  }
}

function renderReference(node) {
  const label = node.refKind === "themeRef" ? "Theme reference" : "Suite reference";
  return [
    `<article class="ju-card ju-reference" aria-label="${escapeAttr(label)}">`,
    `<header class="ju-card-head"><span class="ju-chip">${escapeHtml(node.refKind)}</span><h4>${escapeHtml(node.refId ?? "reference")}</h4></header>`,
    renderKeyValues(node.display ?? {}),
    `<p class="ju-muted">Display-only reference · executable: ${node.executable ? "true" : "false"}</p>`,
    `</article>`,
  ].join("");
}

export function renderNodeHtml(node) {
  if (!node || typeof node !== "object") return "";
  if (node.type === "text") return escapeHtml(node.value);
  if (node.type === "reference") return renderReference(node);
  if (node.type === "element") return renderElement(node);
  return "";
}

// --- compatibility fixture card ----------------------------------------------

const STATE_LABEL = {
  renderable: "Renderable",
  "display-only": "Display only",
  denied: "Denied",
  unsupported: "Unsupported",
  invalid: "Invalid (failed closed)",
  error: "Error",
};

export function renderCompatCard({ fixture, rendered }) {
  const state = rendered.state;
  const reasons =
    rendered.reasons && rendered.reasons.length > 0
      ? `<details class="ju-reasons"><summary>Why (${rendered.reasons.length})</summary><ul>${rendered.reasons
          .map((r) => `<li>${escapeHtml(r)}</li>`)
          .join("")}</ul></details>`
      : "";
  return [
    `<section class="ju-fixture" aria-label="${escapeAttr(fixture.fixtureId)}">`,
    `<header class="ju-fixture-head">`,
    `<code class="ju-fixture-id">${escapeHtml(fixture.fixtureId)}</code>`,
    `<span class="ju-badge" data-state="${escapeAttr(state)}">${escapeHtml(STATE_LABEL[state] ?? state)}</span>`,
    `</header>`,
    `<div class="ju-fixture-body">${renderNodeHtml(rendered.node)}</div>`,
    reasons,
    `</section>`,
  ].join("");
}

// --- presentation panel ------------------------------------------------------

export function renderPresentationPanel({ fixture, presented }) {
  const { descriptor, status } = presented;
  const flags = Array.isArray(descriptor.flags) ? descriptor.flags : [];
  const flagChips = flags
    .map((flag) => `<span class="ju-flag" data-status="${escapeAttr(flag)}">${escapeHtml(flag)}</span>`)
    .join("");
  return [
    `<section class="ju-panel" data-status="${escapeAttr(status)}" aria-label="${escapeAttr(fixture.panelId)}">`,
    `<header class="ju-panel-head">`,
    `<div><code class="ju-panel-id">${escapeHtml(fixture.panelId)}</code><span class="ju-panel-kind">${escapeHtml(descriptor.kind)}</span></div>`,
    `<span class="ju-badge" data-status="${escapeAttr(status)}">${escapeHtml(status)}</span>`,
    `</header>`,
    flagChips ? `<div class="ju-chips" aria-label="Operational flags">${flagChips}</div>` : "",
    `<div class="ju-panel-body">${renderValue(descriptor.body)}</div>`,
    `</section>`,
  ].join("");
}

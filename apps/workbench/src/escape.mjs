// HTML/text safety helpers for the Studio UI showcase generator.
//
// The showcase serializes the resident renderer's inert render tree and the
// presentation seam's descriptors into static HTML. Those structures are already
// JSON-inert (no callbacks, no HTML-like strings survive the renderer's scan),
// but this generator still escapes every echoed value at the HTML boundary so a
// future, less-trusted data source cannot inject markup. Escaping here is
// defense in depth, not a substitute for the renderer guards.

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

// Attribute values are escaped with the same map; quoting is always double.
export function escapeAttr(value) {
  return escapeHtml(value);
}

// --- WCAG relative-contrast (used for the contrast-lock evidence) ------------

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function parseHex(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!match) return null;
  const int = Number.parseInt(match[1], 16);
  return { r: (int >> 16) & 0xff, g: (int >> 8) & 0xff, b: int & 0xff };
}

function relativeLuminance({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

// WCAG 2.x contrast ratio between two hex colors, rounded to 2 decimals.
// Returns null if either color is not a parseable 6-digit hex.
export function contrastRatio(hexA, hexB) {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  if (!a || !b) return null;
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

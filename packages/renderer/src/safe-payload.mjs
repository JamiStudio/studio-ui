// Shared safe-payload guard for the Studio UI resident renderer.
//
// Renderer payloads are display data, never code. The security-critical
// primitives live here so the runtime renderer (`render.mjs`) and the
// compatibility contract check (`scripts/contracts/validate-contracts.mjs`)
// enforce one identical resident allowlist and one identical unsafe-payload
// scan. If these ever diverged, a payload the contract check rejects could
// still reach the renderer (or vice versa); a single source removes that gap.

// The resident vocabulary is deliberately small. A payload whose component is
// outside this set fails closed to an unsupported display state rather than
// rendering. Names are the kebab-case form of the resident component vocabulary.
export const allowedComponents = new Set([
  "action-slot",
  "agent-panel",
  "artifact-card",
  "button",
  "data-list",
  "docs-source-panel",
  "inline-notice",
  "media-grid",
  "panel",
  "text",
  "text-field",
]);

// Credentials never travel inline in a renderer payload. The harness exposes
// them only as resolved `harness://secrets/*` references the renderer may
// display; an inline literal under any of these keys fails closed.
export const secretBearingPropKeys = new Set([
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "credential",
  "credentials",
  "accesstoken",
  "access_token",
  "privatekey",
  "private_key",
  "clientsecret",
  "client_secret",
]);

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Event-handler-shaped props are rejected in every casing. React-style
// camelCase (`onClick`) and bare HTML attribute casing (`onclick`/`onerror`/
// `onload`) both reach the DOM as executable handlers, so the `on` prefix is
// matched case-insensitively. Event wiring in this contract flows through
// allowlisted action references, never inline props. The remaining keys are
// React-internal/escape-hatch markers that would smuggle code or raw HTML.
export function isUnsafePropKey(key) {
  return (
    /^on[a-z]/i.test(key) ||
    key === "dangerouslySetInnerHTML" ||
    key === "packageImport" ||
    key === "$$typeof" ||
    key === "__html" ||
    key === "_owner"
  );
}

export function isInlineSecret(key, value) {
  return (
    secretBearingPropKeys.has(key.toLowerCase()) &&
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("harness://secrets/")
  );
}

// Recursively collect the reasons a value is unsafe to render. An empty result
// means the value carries no HTML-like strings, `javascript:` URLs,
// event-handler/escape-hatch props, or inline secrets at any depth.
export function scanUnsafePayload(value, failures = []) {
  if (typeof value === "string") {
    if (/<\/?[a-z][\s\S]*>/i.test(value)) failures.push("HTML-like string is not allowed");
    if (/javascript:/i.test(value)) failures.push("javascript: URL is not allowed");
  } else if (Array.isArray(value)) {
    for (const item of value) scanUnsafePayload(item, failures);
  } else if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (isUnsafePropKey(key)) failures.push(`unsafe prop ${key}`);
      if (isInlineSecret(key, item)) {
        failures.push(`secret-bearing prop ${key} must be a harness secret reference`);
      }
      scanUnsafePayload(item, failures);
    }
  }
  return failures;
}

export function componentNameAllowed(name) {
  return allowedComponents.has(name);
}

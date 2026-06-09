// Studio UI minimal resident renderer.
//
// This is the smallest real renderer surface that proves the safe-rendering
// contract: it turns a validated, harness-originated structured payload into an
// inert, JSON-serializable render tree built only from the resident allowlisted
// vocabulary. It is NOT a React renderer and NOT a browser/workbench app. It
// never imports or executes model-provided React, HTML, scripts, package
// imports, event handlers, `javascript:` URLs, or inline secrets, and it never
// emits an executable callback. Anything it cannot prove safe degrades to a
// display-only fallback state.
//
// Policy decisions (denied/pending approval), tool execution, and audit records
// stay owned by Jami Harness. Here a denied or pending action is a display
// state, not an executable shortcut.

import {
  componentNameAllowed,
  isInlineSecret,
  isPlainObject,
  isUnsafePropKey,
  scanUnsafePayload,
} from "./safe-payload.mjs";
import {
  UI_PAYLOAD_SCHEMA_VERSION,
  vocabularyHandshake,
  validateComponentProps,
} from "../../ui/src/index.mjs";

const PAYLOAD_SCHEMA_VERSION = UI_PAYLOAD_SCHEMA_VERSION;

const PAYLOAD_ID_PATTERN = /^uip_[a-z0-9][a-z0-9_-]*$/;
const ACTION_ID_PATTERN = /^act_[a-z0-9][a-z0-9_-]*$/;
const ARTIFACT_VIEW_REF_PATTERN = /^artv_[a-z0-9][a-z0-9_-]*$/;
const THEME_REF_PATTERN = /^theme_[a-z0-9][a-z0-9_-]*$/;
const SUITE_REF_PATTERN = /^suite_[a-z0-9][a-z0-9_-]*$/;
const COMPONENT_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

// --- inert node builders -----------------------------------------------------

function textNode(value) {
  return { type: "text", value: String(value ?? "") };
}

function fallbackNode(message) {
  return {
    type: "element",
    component: "inline-notice",
    props: { tone: "warning" },
    children: [textNode(message)],
    actions: [],
  };
}

// Deep-clone display data while dropping anything unsafe. Props that reach a
// renderable element have already passed the unsafe scan, so this strips
// nothing in practice; it runs anyway so the renderer never trusts its input to
// have been pre-filtered. Only JSON-shaped values survive, so the output can
// never carry a function/callback.
function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (isPlainObject(value)) {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (isUnsafePropKey(key) || isInlineSecret(key, item)) continue;
      out[key] = sanitizeValue(item);
    }
    return out;
  }
  if (typeof value === "function") return null;
  return value;
}

function sanitizeProps(props) {
  return isPlainObject(props) ? sanitizeValue(props) : {};
}

// --- uiPayload ---------------------------------------------------------------

// Structural + safety reasons a payload cannot be rendered. An empty result
// means the payload is well-formed and safe; the caller then checks the
// allowlist separately so an unsupported (but well-formed) component is
// reported distinctly from an invalid one.
function uiPayloadIssues(payload) {
  if (!isPlainObject(payload)) return ["missing payload"];
  const issues = [];
  if (payload.schemaVersion !== PAYLOAD_SCHEMA_VERSION) {
    issues.push("unsupported payload schemaVersion");
  }
  if (payload.vocabularyHandshakeVersion !== vocabularyHandshake.schemaVersion) {
    issues.push("unsupported vocabularyHandshakeVersion");
  }
  if (!PAYLOAD_ID_PATTERN.test(payload.payloadId ?? "")) {
    issues.push("payloadId must use uip_ prefix");
  }
  const component = payload.componentRef;
  if (component?.namespace !== "@jami-studio/ui") {
    issues.push("componentRef namespace must be @jami-studio/ui");
  }
  if (!COMPONENT_NAME_PATTERN.test(component?.name ?? "")) {
    issues.push("componentRef name must be kebab-case");
  }
  if (!component?.version) {
    issues.push("componentRef version is required");
  }
  for (const ref of payload.actionRefs ?? []) {
    if (!ACTION_ID_PATTERN.test(ref)) issues.push(`actionRef ${ref} must use act_ prefix`);
  }
  for (const ref of payload.artifactViewRefs ?? []) {
    if (!ARTIFACT_VIEW_REF_PATTERN.test(ref)) issues.push(`artifactViewRef ${ref} must use artv_ prefix`);
  }
  if (payload.themeRef && !THEME_REF_PATTERN.test(payload.themeRef)) {
    issues.push("themeRef must use theme_ prefix");
  }
  if (payload.suiteRef && !SUITE_REF_PATTERN.test(payload.suiteRef)) {
    issues.push("suiteRef must use suite_ prefix");
  }
  scanUnsafePayload(payload.props, issues);
  scanUnsafePayload(payload.children, issues);
  if (componentNameAllowed(component?.name) && issues.length === 0) {
    issues.push(...validateComponentProps(component.name, payload.props ?? {}));
  }
  return issues;
}

function buildElement(payload) {
  return {
    type: "element",
    component: payload.componentRef.name,
    props: sanitizeProps(payload.props),
    children: (payload.children ?? []).map(textNode),
    // Action references are display data only: a stable id the host can wire to
    // a harness-owned action slot. The renderer never attaches a callback.
    actions: (payload.actionRefs ?? []).map((actionId) => ({ actionId, executable: false })),
    artifactViewRefs: [...(payload.artifactViewRefs ?? [])],
    themeRef: payload.themeRef ?? null,
    suiteRef: payload.suiteRef ?? null,
  };
}

export function renderUiPayload(payload) {
  // Fallback copy is renderer-owned, never echoed from the payload. A rejected
  // payload is untrusted input; reflecting its `fallback.message` verbatim would
  // surface attacker-influenced free text (and could itself contain HTML-like or
  // `javascript:` substrings). The structured `reasons` carry the detail.
  const issues = uiPayloadIssues(payload);
  if (issues.length > 0) {
    return {
      state: "invalid",
      node: fallbackNode("This payload was rejected by the resident renderer."),
      reasons: issues,
    };
  }
  if (!componentNameAllowed(payload.componentRef.name)) {
    return {
      state: "unsupported",
      node: fallbackNode("This component is not supported by the resident renderer."),
      reasons: [`component ${payload.componentRef.name} is not allowlisted`],
    };
  }
  return { state: "renderable", node: buildElement(payload), reasons: [] };
}

// --- actionRef (display-only / denied) ---------------------------------------

export function renderActionRef(actionRef) {
  const denied = actionRef?.state === "denied";
  return {
    // A denied action is its own terminal display state; every other action
    // reference renders display-only. Neither path exposes execution.
    state: denied ? "denied" : "display-only",
    node: {
      type: "element",
      component: "action-slot",
      props: {
        label: String(actionRef?.label ?? ""),
        risk: actionRef?.risk ?? null,
        policyScope: actionRef?.policyScope ?? null,
        confirmationMode: actionRef?.confirmationMode ?? null,
        state: actionRef?.state ?? null,
      },
      // Reference only. The renderer deliberately drops any `execution` block on
      // the input (e.g. a forged `execution.canExecute: true`) and always emits
      // a non-executable reference. Execution stays with the harness.
      action: {
        actionId: actionRef?.actionId ?? null,
        route: actionRef?.route ?? null,
        executable: false,
      },
      denial: denied
        ? {
            reason: actionRef?.denial?.reason ?? null,
            auditRef: actionRef?.denial?.auditRef ?? null,
          }
        : null,
      children: [textNode(actionRef?.label ?? "")],
    },
    reasons: [],
  };
}

// --- artifactView / themeRef / suiteRef (display-only references) ------------

export function renderArtifactView(artifactView) {
  return {
    state: "display-only",
    node: {
      type: "element",
      component: "artifact-card",
      props: {
        title: String(artifactView?.title ?? ""),
        kind: artifactView?.kind ?? null,
        promotionState: artifactView?.promotionState ?? null,
        artifactViewId: artifactView?.artifactViewId ?? null,
        artifactId: artifactView?.artifactId ?? null,
      },
      // Available renderer modes are surfaced as metadata, never instantiated.
      renderers: (artifactView?.renderers ?? []).map((renderer) => ({
        rendererId: renderer?.rendererId ?? null,
        mode: renderer?.mode ?? null,
      })),
      provenance: {
        runId: artifactView?.provenance?.runId ?? null,
        evidenceRef: artifactView?.provenance?.evidenceRef ?? null,
      },
      children: [],
      actions: [],
    },
    reasons: [],
  };
}

export function renderThemeRef(themeRef) {
  return {
    state: "display-only",
    node: {
      type: "reference",
      refKind: "themeRef",
      refId: themeRef?.themeId ?? null,
      display: {
        tokenSchemaVersion: themeRef?.tokenSchemaVersion ?? null,
        sourceKind: themeRef?.source?.kind ?? null,
        registryItemId: themeRef?.source?.registryItemId ?? null,
        restorePackage: themeRef?.restoreTarget?.packageName ?? null,
      },
      executable: false,
    },
    reasons: [],
  };
}

export function renderSuiteRef(suiteRef) {
  return {
    state: "display-only",
    node: {
      type: "reference",
      refKind: "suiteRef",
      refId: suiteRef?.suiteId ?? null,
      display: {
        lane: suiteRef?.lane ?? null,
        appShellId: suiteRef?.appShellId ?? null,
        installedItems: [...(suiteRef?.installedItems ?? [])],
        routeMap: (suiteRef?.routeMap ?? []).map((route) => ({
          routeId: route?.routeId ?? null,
          path: route?.path ?? null,
        })),
      },
      executable: false,
    },
    reasons: [],
  };
}

// --- rendererError -----------------------------------------------------------

export function renderRendererError(rendererError) {
  return {
    state: "error",
    node: {
      type: "element",
      component: "inline-notice",
      props: {
        // `code` is a validated machine identifier; the human message is
        // renderer-owned rather than echoed from the (untrusted) run event.
        tone: "danger",
        code: rendererError?.code ?? "renderer_error",
        recoverable: Boolean(rendererError?.recoverable),
      },
      children: [textNode("The resident renderer reported an error.")],
      actions: [],
    },
    reasons: [],
  };
}

// --- fixture dispatch --------------------------------------------------------

// Render a compatibility fixture by its declared kind. The renderer computes the
// display state independently from the fixture's `expectedRendererState`; the
// test suite asserts the two agree, which is how the fixture corpus proves the
// renderer fails closed on every negative case.
export function renderFixture(fixture) {
  switch (fixture?.kind) {
    case "uiPayload":
    case "unsupportedComponent":
    case "invalidPayload":
      return renderUiPayload(fixture.payload);
    case "deniedAction":
    case "actionRef":
      return renderActionRef(fixture.actionRef);
    case "artifactView":
      return renderArtifactView(fixture.artifactView);
    case "themeRef":
      return renderThemeRef(fixture.themeRef);
    case "suiteRef":
      return renderSuiteRef(fixture.suiteRef);
    case "rendererError":
      return renderRendererError(fixture.rendererError);
    default:
      return {
        state: "invalid",
        node: fallbackNode("Unknown fixture kind."),
        reasons: [`unknown fixture kind ${fixture?.kind ?? "(none)"}`],
      };
  }
}

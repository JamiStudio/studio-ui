// Studio UI workbench presentation seam.
//
// This is the smallest real workbench presentation foundation. It turns
// harness-originated reference data (artifact views, evidence packets, run-event
// traces, action refs) into inert, JSON-serializable *presentation descriptors*
// annotated with the operational states a dense workbench surface must show:
// empty, loading, denied, redacted, stale, missing-source, unsupported, error,
// and ready.
//
// What this is NOT:
//   - It is not a browser, React, or app surface. There is no workbench app
//     shell in this repo yet; this seam produces descriptors a future shell
//     could render, and nothing here mounts a DOM or runs an event loop.
//   - It does not own execution, policy, approval, provenance, memory, or audit
//     decisions. Those stay in Jami Harness. A denied action, a redaction
//     policy, or a freshness class is displayed here, never decided here.
//   - It does not invent parallel artifact/trace/evidence data. Every descriptor
//     is derived strictly from the harness ref it is given; identifiers are
//     echoed, never fabricated, and unknown/missing source data fails closed to
//     an explicit operational state rather than a synthesized placeholder.
//
// Memory/context references are intentionally not synthesized: the harness
// contract surface does not yet model a memory/context ref, so this seam reports
// `missing-source` for them instead of inventing a shape. See
// docs/architecture/workbench-presentation.md.

import {
  isInlineSecret,
  isPlainObject,
  isUnsafePropKey,
  scanUnsafePayload,
} from "./safe-payload.mjs";
import { renderActionRef } from "./render.mjs";

const ARTIFACT_VIEW_ID_PATTERN = /^artv_[a-z0-9][a-z0-9_-]*$/;
const ARTIFACT_ID_PATTERN = /^art_[a-z0-9][a-z0-9_-]*$/;
const EVIDENCE_ID_PATTERN = /^ev_[a-z0-9][a-z0-9_-]*$/;
const RUN_ID_PATTERN = /^run_[a-z0-9][a-z0-9_-]*$/;

// Harness schema IDs this seam consumes. The presentation layer is consumer-side
// only: it mirrors the canonical harness schemas, it does not own them.
export const harnessSchemaIds = Object.freeze({
  artifactView: "https://jami.studio/schemas/harness/artifact-view.schema.json",
  evidencePacket: "https://jami.studio/schemas/harness/evidence-packet.schema.json",
  runEvent: "https://jami.studio/schemas/harness/run-event.schema.json",
  actionRef: "https://jami.studio/schemas/harness/action-ref.schema.json",
});

// Operational workbench states, ordered by display precedence (highest first).
// When more than one condition holds (e.g. a stale, redacted packet) the highest
// precedence state is the panel's primary status; every condition is still
// listed in `flags` so the surface can badge them all.
const STATUS_PRECEDENCE = [
  "missing-source",
  "unsupported",
  "error",
  "denied",
  "redacted",
  "stale",
  "empty",
  "loading",
  "ready",
];

function primaryStatus(flags) {
  for (const status of STATUS_PRECEDENCE) {
    if (flags.includes(status)) return status;
  }
  return "ready";
}

// Strip anything unsafe or secret-bearing from display data, at any depth. Only
// JSON-shaped values survive, so a descriptor can never carry a callback. This
// runs on every value the seam echoes from a (untrusted) harness ref so the
// presentation output is provably inert.
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
  if (typeof value === "string") {
    // Never echo HTML-like or javascript: free text from a harness ref.
    if (/<\/?[a-z][\s\S]*>/i.test(value) || /javascript:/i.test(value)) return null;
  }
  return value;
}

function descriptor(kind, status, flags, body, reasons = []) {
  return {
    status,
    descriptor: {
      type: "workbench-panel",
      kind,
      status,
      flags: [...flags],
      body: sanitizeValue(body),
    },
    reasons,
  };
}

// --- renderer selection (display-only configuration) -------------------------

const RESIDENT_NAMESPACE = "@jami-studio/ui";

// Choose how an artifact should be displayed from its declared renderers. This
// is display configuration, not execution: it picks a mode the resident
// vocabulary can show and reports `unsupported` when none qualifies. It never
// instantiates a renderer.
function selectRenderer(renderers) {
  const available = (Array.isArray(renderers) ? renderers : []).map((renderer) => ({
    rendererId: renderer?.rendererId ?? null,
    mode: renderer?.mode ?? null,
    componentRef: typeof renderer?.componentRef === "string" ? renderer.componentRef : null,
    unsupportedReason: renderer?.unsupportedReason ?? null,
  }));
  // Prefer a resident studio_ui renderer that points at a @jami-studio/ui
  // component; otherwise accept a plain display mode (text/markdown/diff/json/
  // image) the surface can render inertly. A renderer carrying an
  // unsupportedReason is never selected.
  const resident = available.find(
    (renderer) =>
      renderer.mode === "studio_ui" &&
      !renderer.unsupportedReason &&
      typeof renderer.componentRef === "string" &&
      renderer.componentRef.startsWith(`${RESIDENT_NAMESPACE}/`),
  );
  const displayMode = available.find(
    (renderer) =>
      !renderer.unsupportedReason &&
      ["text", "markdown", "diff", "json", "image"].includes(renderer.mode),
  );
  const selected = resident ?? displayMode ?? null;
  return { available, selected, supported: selected !== null };
}

// --- artifactView (artifacts, traces, evidence artifacts) --------------------

export function presentArtifactView(artifactView, { lifecycle } = {}) {
  if (lifecycle === "loading") return descriptor("artifactView", "loading", ["loading"], {});
  if (!isPlainObject(artifactView)) {
    return descriptor("artifactView", "missing-source", ["missing-source"], {}, ["missing artifactView ref"]);
  }

  const flags = [];
  const reasons = [];

  // Provenance is harness-owned and required to trust/locate the source. Without
  // a run id and evidence ref we cannot present it as a sourced artifact.
  const provenance = artifactView.provenance;
  const hasSource =
    isPlainObject(provenance) &&
    RUN_ID_PATTERN.test(provenance.runId ?? "") &&
    Boolean(provenance.sourceCommit) &&
    Boolean(provenance.evidenceRef);
  if (
    !ARTIFACT_VIEW_ID_PATTERN.test(artifactView.artifactViewId ?? "") ||
    !ARTIFACT_ID_PATTERN.test(artifactView.artifactId ?? "") ||
    !hasSource
  ) {
    flags.push("missing-source");
    reasons.push("artifactView is missing artifactViewId, artifactId, or provenance");
  }

  const renderer = selectRenderer(artifactView.renderers);
  if (!renderer.supported) {
    flags.push("unsupported");
    reasons.push("no resident or display renderer is available for this artifact");
  }

  if (flags.length === 0) flags.push("ready");

  const body = {
    artifactViewId: artifactView.artifactViewId ?? null,
    artifactId: artifactView.artifactId ?? null,
    // `kind` discriminates artifact / trace / evidence artifacts; the surface
    // can branch on it but the data shape is identical and harness-owned.
    artifactKind: artifactView.kind ?? null,
    title: artifactView.title ?? null,
    promotionState: artifactView.promotionState ?? null,
    renderer,
    provenance: hasSource
      ? {
          runId: provenance.runId,
          sourceCommit: provenance.sourceCommit,
          evidenceRef: provenance.evidenceRef,
        }
      : null,
  };
  return descriptor("artifactView", primaryStatus(flags), flags, body, reasons);
}

// --- evidencePacket (redaction- and freshness-aware) -------------------------

export function presentEvidencePacket(evidencePacket, { lifecycle } = {}) {
  if (lifecycle === "loading") return descriptor("evidencePacket", "loading", ["loading"], {});
  if (!isPlainObject(evidencePacket)) {
    return descriptor("evidencePacket", "missing-source", ["missing-source"], {}, ["missing evidencePacket ref"]);
  }

  const flags = [];
  const reasons = [];

  const source = evidencePacket.source;
  const hasSource =
    EVIDENCE_ID_PATTERN.test(evidencePacket.evidenceId ?? "") &&
    isPlainObject(source) &&
    Boolean(source.repo) &&
    Boolean(source.commit) &&
    Boolean(source.recordedAt);
  if (!hasSource) {
    flags.push("missing-source");
    reasons.push("evidence packet is missing evidenceId or source repo/commit/recordedAt");
  }

  // Redaction is a harness decision; the seam only reflects it and guarantees no
  // secret value is ever echoed (sanitizeValue drops secret-bearing keys too).
  const redaction = evidencePacket.redaction;
  const redacted =
    isPlainObject(redaction) &&
    (redaction.containsSecrets === true || (redaction.privatePayloadPolicy ?? "none") !== "none");
  if (redacted) {
    flags.push("redacted");
    reasons.push("harness marked this evidence as redacted or secret-bearing");
  }

  if (evidencePacket.freshnessClass === "stale") {
    flags.push("stale");
    reasons.push("harness marked this evidence freshnessClass as stale");
  }

  const commands = Array.isArray(evidencePacket.commands) ? evidencePacket.commands : [];
  if (commands.length === 0 && flags.length === 0) {
    flags.push("empty");
  }
  if (flags.length === 0) flags.push("ready");

  const body = {
    evidenceId: evidencePacket.evidenceId ?? null,
    subject: evidencePacket.subject ?? null,
    freshnessClass: evidencePacket.freshnessClass ?? null,
    source: hasSource
      ? { repo: source.repo, commit: source.commit, recordedAt: source.recordedAt }
      : null,
    redaction: isPlainObject(redaction)
      ? {
          containsSecrets: Boolean(redaction.containsSecrets),
          privatePayloadPolicy: redaction.privatePayloadPolicy ?? "none",
        }
      : null,
    // Command *status* is the operational signal a workbench shows; the
    // unavailable/failed/not_run statuses surface directly. Secret values cannot
    // appear here because the harness evidence schema carries no secret payloads
    // and sanitizeValue strips any secret-bearing key regardless.
    commands: commands.map((entry) => ({
      command: entry?.command ?? null,
      status: entry?.status ?? null,
      recordedAt: entry?.recordedAt ?? null,
      unavailableReason: entry?.unavailableReason ?? null,
    })),
    acceptedContracts: Array.isArray(evidencePacket.acceptedContracts)
      ? [...evidencePacket.acceptedContracts]
      : [],
  };
  return descriptor("evidencePacket", primaryStatus(flags), flags, body, reasons);
}

// --- trace (run-event timeline) ----------------------------------------------

export function presentTrace(trace, { lifecycle } = {}) {
  if (lifecycle === "loading") return descriptor("trace", "loading", ["loading"], {});
  const events = Array.isArray(trace?.events) ? trace.events : Array.isArray(trace) ? trace : null;
  if (!Array.isArray(events)) {
    return descriptor("trace", "missing-source", ["missing-source"], {}, ["missing run-event trace"]);
  }
  if (events.length === 0) {
    return descriptor("trace", "empty", ["empty"], { runId: trace?.runId ?? null, events: [] });
  }

  const flags = [];
  const reasons = [];
  // A trace is sourced only if every event ties back to a run id.
  const runId = trace?.runId ?? events[0]?.runId ?? null;
  const sourced = RUN_ID_PATTERN.test(runId ?? "") && events.every((e) => e?.runId === runId);
  if (!sourced) {
    flags.push("missing-source");
    reasons.push("trace events do not share a single harness runId");
  }
  // A renderer.error event surfaces the trace as an error state.
  if (events.some((e) => e?.eventType === "renderer.error")) {
    flags.push("error");
    reasons.push("trace contains a renderer.error event");
  }
  if (flags.length === 0) flags.push("ready");

  const body = {
    runId,
    eventCount: events.length,
    // Display-only timeline. Only enums, ids, timestamps, and a sanitized policy
    // summary are echoed; free-text reasons pass through sanitizeValue.
    events: [...events]
      .sort((a, b) => (a?.sequence ?? 0) - (b?.sequence ?? 0))
      .map((event) => ({
        eventId: event?.eventId ?? null,
        sequence: event?.sequence ?? null,
        occurredAt: event?.occurredAt ?? null,
        eventType: event?.eventType ?? null,
        traceId: event?.traceRef?.traceId ?? null,
        spanId: event?.traceRef?.spanId ?? null,
        rendererState: event?.rendererState ?? null,
        policyDecision: isPlainObject(event?.policyDecision)
          ? { decision: event.policyDecision.decision ?? null, scope: event.policyDecision.scope ?? null }
          : null,
      })),
  };
  return descriptor("trace", primaryStatus(flags), flags, body, reasons);
}

// --- memory / context (not yet modeled by the harness) -----------------------

// The harness contract surface does not yet define a memory/context ref. Rather
// than invent a parallel shape, this seam fails closed to `missing-source` and
// records the gap. When the harness adds a memory/context schema, this becomes a
// real presenter mirroring it.
export function presentMemoryContext(_ref, { lifecycle } = {}) {
  if (lifecycle === "loading") return descriptor("memoryContext", "loading", ["loading"], {});
  return descriptor(
    "memoryContext",
    "missing-source",
    ["missing-source"],
    { modeled: false },
    ["memory/context refs are not yet modeled by the harness contract surface"],
  );
}

// --- action ref (delegates to the resident renderer) -------------------------

// Action presentation reuses the resident renderer's display-only action node so
// the workbench never gains a second, divergent action path. Denied stays denied.
export function presentActionRef(actionRef, { lifecycle } = {}) {
  if (lifecycle === "loading") return descriptor("actionRef", "loading", ["loading"], {});
  if (!isPlainObject(actionRef)) {
    return descriptor("actionRef", "missing-source", ["missing-source"], {}, ["missing actionRef"]);
  }
  const rendered = renderActionRef(actionRef);
  const status = rendered.state === "denied" ? "denied" : "ready";
  return {
    status,
    descriptor: {
      type: "workbench-panel",
      kind: "actionRef",
      status,
      flags: [status],
      body: sanitizeValue(rendered.node),
    },
    reasons: rendered.reasons,
  };
}

// --- dispatcher --------------------------------------------------------------

// Present a workbench panel from a typed envelope. The envelope is how a future
// workbench surface declares lifecycle (loading/empty) without yet holding a
// resolved ref. `kind` selects the presenter; `ref` is the harness reference.
export function presentWorkbenchPanel(panel) {
  const lifecycle = panel?.lifecycle;
  const opts = lifecycle ? { lifecycle } : {};
  switch (panel?.kind) {
    case "artifactView":
      return presentArtifactView(panel.ref ?? panel.artifactView, opts);
    case "evidencePacket":
      return presentEvidencePacket(panel.ref ?? panel.evidencePacket, opts);
    case "trace":
      return presentTrace(panel.ref ?? panel.trace, opts);
    case "memoryContext":
      return presentMemoryContext(panel.ref ?? panel.memoryContext, opts);
    case "actionRef":
      return presentActionRef(panel.ref ?? panel.actionRef, opts);
    default:
      return descriptor("unknown", "missing-source", ["missing-source"], {}, [
        `unknown workbench panel kind ${panel?.kind ?? "(none)"}`,
      ]);
  }
}

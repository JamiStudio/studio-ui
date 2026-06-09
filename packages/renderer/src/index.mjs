// Public surface of the Studio UI minimal resident renderer.
//
// This package validates and renders harness-originated structured UI payloads
// into an inert, JSON-serializable render tree using the resident allowlisted
// vocabulary. It does not execute actions, render React, or own policy: denied
// and pending-approval states are display-only here.

export {
  renderFixture,
  renderUiPayload,
  renderActionRef,
  renderArtifactView,
  renderThemeRef,
  renderSuiteRef,
  renderRendererError,
} from "./render.mjs";

export {
  allowedComponents,
  componentNameAllowed,
  scanUnsafePayload,
} from "./safe-payload.mjs";

// Workbench presentation seam: turns harness artifact/trace/evidence/memory/
// action refs into inert, display-only operational presentation descriptors.
export {
  harnessSchemaIds,
  presentArtifactView,
  presentEvidencePacket,
  presentTrace,
  presentMemoryContext,
  presentActionRef,
  presentWorkbenchPanel,
} from "./presentation.mjs";

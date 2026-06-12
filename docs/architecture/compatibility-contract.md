# Harness Compatibility Contract

Status: Foundation handshake
Last updated: 2026-06-09

## Purpose

Studio UI and Jami Harness need a shared contract spine before runtime work expands.
This repo now carries the UI-side fixture mirror and validator for the first shared
families. The harness repo should add matching exports or mirrors without moving
runtime policy ownership into Studio UI.

## UI-Side Fixture Location

- `packages/renderer/fixtures/compatibility/valid/`
- `packages/renderer/fixtures/compatibility/invalid/`
- `packages/renderer/schemas/compatibility-fixture.schema.json`
- `packages/renderer/fixtures/presentation/`
- `packages/renderer/fixtures/shared-seams/phase-2-shared-seam-coverage.json`
- `packages/renderer/schemas/shared-seam-coverage.schema.json`
- `pnpm contracts:check`

Studio UI fixtures carry a renderer fixture envelope plus a `harnessSchemaId`
that points at the sibling harness schema family they mirror. The fixture
payloads use harness-consumable stable IDs such as `uip_*`, `act_*`, `artv_*`,
`theme_*`, `suite_*`, and `harness://actions/*` routes, but Studio UI does not
import harness implementation code.

## Covered Families

- `uiPayload`
- `runEvent`
- `artifactView`
- `actionRef` denied, approval, expired, replayed, missing-source, secret-bearing,
  and display-only states
- `themeRef`
- `suiteRef`
- `evidencePacket`
- `memoryRecord`
- `contextPack`
- `capabilityManifest`
- unsupported component
- invalid payload
- renderer error

The Phase 2 shared seam coverage manifest is the machine-readable matrix for the
root roadmap cases. It records the required positive, denied, unsupported,
malformed or invalid, missing-source, stale, redacted, expired, and replayed cases
for every shared seam family, maps existing renderer or presentation fixtures
where they exist, and carries safe sample refs for matrix-only cases. The
contract gate fails when a required family/case is missing, when a referenced
fixture drifts from the matrix status, when a sample contains unsafe or
secret-shaped values, or when the generated registry metadata no longer points
at the manifest.

## Expected Harness Handshake

The harness lane should provide compatible fixtures or an exportable fixture package
for the same family names and should preserve these ownership rules:

- Harness owns policy decisions, approvals, action execution, tool side effects,
  artifacts, traces, evidence, and audit.
- Studio UI owns resident component validation, display state, token and registry
  metadata references, and renderer fallback behavior.
- Neither side accepts arbitrary React, HTML, scripts, package imports, or model
  executable UI code as a shared contract.
- Capability manifest cases are mirrored as display/registry compatibility
  states only; the harness remains the source of truth for capability support.

The first cross-repo gate should compare fixture family names, schema versions,
schema IDs, reference ID patterns, negative cases, and expected display/denial
states before renderer or harness runtime streams claim compatibility.

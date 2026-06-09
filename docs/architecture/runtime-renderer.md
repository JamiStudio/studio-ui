# Runtime Renderer Contract

Status: Foundation contract
Last updated: 2026-06-09

## Purpose

`packages/renderer` now owns Studio UI's first machine-readable compatibility
fixture spine for harness-originated UI payloads and display references. This is a
renderer contract foundation, not a React renderer implementation.

## Contract Source

- Schema: `packages/renderer/schemas/compatibility-fixture.schema.json`
- Compatibility fixtures: `packages/renderer/fixtures/compatibility/`
- Check command: `pnpm contracts:check`

## Fixture Families

The first fixture set covers:

- `uiPayload` for resident allowlisted component rendering.
- `artifactView` display metadata with harness evidence references.
- `actionRef` denied-action display state.
- `themeRef` factory theme reference.
- `suiteRef` suite item graph reference.
- unsupported component display state.
- invalid payload rejection.
- renderer error state.

The allowed resident vocabulary for this foundation check is deliberately small:
`ActionSlot`, `ArtifactCard`, `Button`, `InlineNotice`, and `Text`.

## Validation Behavior

`pnpm contracts:check` currently enforces:

- fixture schema URL, id, kind, and expected renderer state.
- allowlisted component names for renderable `uiPayload` fixtures.
- rejection of HTML-like strings, `javascript:` URLs, event-handler props,
  `dangerouslySetInnerHTML`, and package import props.
- denied action fixtures must carry a denied harness policy decision and
  `canExecute: false`.
- artifact views must carry evidence refs.
- theme refs must carry a token version.
- suite refs must carry an item graph.
- renderer errors must carry an explicit error code.

## Ownership Boundary

Studio UI renders or displays the typed data. Jami Harness owns policy decisions,
approval lifecycle, tool execution, action routing, artifact provenance, and audit
records. A denied action is a display state here, not an executable UI shortcut.

## Not Yet Claimed

This pass does not render React components, map AG-UI event streams, import harness
types, or execute actions. The concurrent harness lane still needs a matching fixture
export or mirror for these same families.

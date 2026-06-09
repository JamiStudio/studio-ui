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

The fixture set covers:

- `uiPayload` for resident allowlisted component rendering.
- `artifactView` display metadata with harness evidence references.
- `actionRef` denied-action display state.
- `actionRef` non-executable approval display state (`pending_approval`).
- `themeRef` factory theme reference.
- `suiteRef` suite item graph reference.
- unsupported component display state.
- invalid payload rejection across event-handler props, `dangerouslySetInnerHTML`,
  `javascript:` URLs, foreign component namespaces, serialized React elements,
  inline secret-bearing props, HTML-like strings, package imports, and malformed
  harness reference IDs.
- renderer error state.

The allowed resident vocabulary for this foundation check is deliberately small:
`ActionSlot`, `ArtifactCard`, `Button`, `InlineNotice`, and `Text`. A payload whose
`componentRef.namespace` is not `@jami-studio/ui`, or whose `name` is outside that
allowlist, fails closed rather than rendering.

## Validation Behavior

`pnpm contracts:check` currently enforces:

- fixture schema URL, id, kind, and expected renderer state.
- harness mirror schema IDs for `uiPayload`, `artifactView`, `actionRef`,
  `themeRef`, `suiteRef`, and renderer error run events.
- stable shared reference IDs: `uip_*`, `act_*`, `artv_*`, `art_*`, `theme_*`,
  `suite_*`, and `harness://actions/*`.
- allowlisted component names for renderable `uiPayload` fixtures.
- rejection of HTML-like strings, `javascript:` URLs, event-handler props,
  `dangerouslySetInnerHTML`, serialized React element markers (`$$typeof`, `__html`,
  `_owner`), and package import props.
- rejection of payloads whose component is outside the resident `@jami-studio/ui`
  allowlist or namespace.
- rejection of inline secret-bearing props (`authorization`, `token`, `password`, and
  similar keys); secrets must arrive as harness secret references, never inline literals.
- denied action fixtures must carry a denied harness state and denial audit ref,
  without any executable UI state.
- approval-display action fixtures must carry a non-executable state
  (`available`, `disabled`, or `pending_approval`) and a policy scope, without any
  executable UI state.
- artifact views must carry renderers and an evidence ref.
- theme refs must carry a token schema version and Studio UI source/restore data.
- suite refs must carry installed items and route maps.
- renderer errors must carry an explicit error code plus a renderer error run-event
  mirror.

## Ownership Boundary

Studio UI renders or displays the typed data. Jami Harness owns policy decisions,
approval lifecycle, tool execution, action routing, artifact provenance, and audit
records. A denied action is a display state here, not an executable UI shortcut.

## Not Yet Claimed

This pass does not render React components, map AG-UI event streams, import harness
types, or execute actions. The concurrent harness lane owns its canonical schemas;
Studio UI mirrors the schema IDs and fixture categories for consumer validation.

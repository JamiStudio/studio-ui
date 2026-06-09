# Runtime Renderer Contract

Status: Foundation contract
Last updated: 2026-06-09

## Purpose

`packages/renderer` owns Studio UI's machine-readable compatibility fixture spine
for harness-originated UI payloads and display references, plus a minimal resident
renderer that turns a validated payload into an inert structured render tree. This
is a renderer contract foundation and a small resident render core; it is not a
React renderer, a browser surface, or a workbench app.

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
- each fixture kind maps to exactly one required renderer state (`uiPayload` ->
  renderable, denied actions -> denied, approval/`actionRef`/`artifactView`/`themeRef`/
  `suiteRef` display references -> display-only, unsupported components -> unsupported,
  invalid payloads -> invalid, renderer errors -> error). A kind cannot claim a more
  permissive state than it owns.
- harness mirror schema IDs for `uiPayload`, `artifactView`, `actionRef`,
  `themeRef`, `suiteRef`, and renderer error run events.
- stable shared reference IDs: `uip_*`, `act_*`, `artv_*`, `art_*`, `theme_*`,
  `suite_*`, and `harness://actions/*`.
- allowlisted component names for renderable `uiPayload` fixtures.
- rejection of HTML-like strings, `javascript:` URLs, event-handler props (both
  React-style `onClick` and bare HTML `onclick`/`onerror`/`onload` casing, since each
  reaches the DOM as an executable handler), `dangerouslySetInnerHTML`, serialized React
  element markers (`$$typeof`, `__html`, `_owner`), and package import props.
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

## Resident Renderer Core

`packages/renderer/src` is the smallest real renderer that proves the safe-rendering
contract. It is dependency-free, framework-agnostic, and produces inert,
JSON-serializable output. It does not render React, mount a DOM, run a browser, or
ship an app surface.

- `safe-payload.mjs` owns the security-critical primitives: the resident component
  allowlist, the secret-bearing key set, and the recursive unsafe-payload scan.
  `scripts/contracts/validate-contracts.mjs` imports the same module, so the fixture
  gate (`pnpm contracts:check`) and the runtime renderer enforce one identical
  allowlist and one identical unsafe-payload scan rather than two copies that could
  drift.
- `render.mjs` exposes `renderFixture` plus per-kind functions (`renderUiPayload`,
  `renderActionRef`, `renderArtifactView`, `renderThemeRef`, `renderSuiteRef`,
  `renderRendererError`). Each returns `{ state, node, reasons }` where `node` is an
  inert descriptor tree (`element` / `text` / `reference`), never a component
  instance or callback.

Renderer behavior:

- A valid `uiPayload` whose component is allowlisted renders to an `element` node
  using the resident component name, with sanitized props and text-only children.
- Action references render display-only. The renderer drops any `execution` block on
  the input (including a forged `execution.canExecute: true`) and always emits a
  non-executable `{ executable: false }` reference. A denied action renders the
  `denied` state with its denial reason and audit ref; it never carries an
  executable shortcut.
- Pending-approval, `artifactView`, `themeRef`, and `suiteRef` references render the
  `display-only` state with their validated metadata and no executable capability.
- Unknown component names degrade to `unsupported`; malformed, unsafe, or
  foreign-namespace payloads fail closed to `invalid`; renderer faults render the
  `error` state. Rejected and error paths use renderer-owned fallback copy and never
  echo untrusted payload free text.

The renderer computes its display state independently from each fixture's declared
`expectedRendererState`. `packages/renderer/test/render.test.mjs` (run with
`node --test`) asserts the two agree for every fixture, that the output of every
fixture is JSON-inert, carries no callbacks or executable capability, and contains
no unsafe values, and that rejected payloads never reach a renderable state.

## Workbench Presentation Seam

`packages/renderer/src/presentation.mjs` builds on this render core to present
harness refs in a dense operational workbench. It turns `artifactView` (including
the `trace` and `evidence` artifact kinds), `evidencePacket`, run-event traces,
and `actionRef` data into inert display-only descriptors annotated with workbench
operational states: empty, loading, denied, redacted, stale, missing-source,
unsupported, error, and ready. Memory/context refs are not modeled by the harness
yet, so the seam fails closed to `missing-source` rather than inventing a shape.
`pnpm contracts:check` runs the presentation fixtures
(`packages/renderer/fixtures/presentation/`) through the seam. See
`docs/architecture/workbench-presentation.md`.

## Ownership Boundary

Studio UI renders or displays the typed data. Jami Harness owns policy decisions,
approval lifecycle, tool execution, action routing, artifact provenance, and audit
records. A denied action is a display state here, not an executable UI shortcut.

## Not Yet Claimed

The resident render core produces inert structured output only. It does not render
React components, mount a DOM, run a browser or workbench app, map AG-UI event
streams, import harness types, or execute actions. There is no app/browser surface in
this repo yet, so no browser, screenshot, or accessibility smoke applies. The
concurrent harness lane owns its canonical schemas; Studio UI mirrors the schema IDs
and fixture categories for consumer validation and renders the validated data with
resident allowlisted, non-executable output.

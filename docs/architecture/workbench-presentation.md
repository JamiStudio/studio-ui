# Workbench Presentation Seam

Status: Foundation contract
Last updated: 2026-06-09

## Purpose

`packages/renderer/src/presentation.mjs` is Studio UI's workbench presentation
seam. It turns harness-originated reference data into inert, JSON-serializable
*presentation descriptors* annotated with the operational states a dense
workbench surface must show. It is the smallest real foundation for displaying
and configuring shared harness refs without owning any runtime execution.

This is not a browser, React, or app surface. There is no workbench app shell in
this repo yet. The seam produces descriptors a future shell could render; nothing
here mounts a DOM, runs an event loop, executes actions, or owns policy.

## What It Consumes

The seam consumes only shared harness reference families. It mirrors the harness
schema ids; it does not own or redefine them.

- `artifactView` (`artifact-view.schema.json`) — artifacts, including the
  harness `kind` values `trace` and `evidence`. The seam branches on `kind` for
  display but the data shape stays harness-owned.
- `evidencePacket` (`evidence-packet.schema.json`) — evidence with freshness and
  redaction state.
- trace (`run-event.schema.json`) — a run-event timeline carrying `traceRef`.
- `actionRef` (`action-ref.schema.json`) — delegated to the resident renderer's
  display-only action node so there is no second, divergent action path.

Memory/context references are intentionally **not** synthesized. The harness
contract surface does not yet model a memory/context ref, so the seam fails
closed to `missing-source` and records the gap rather than inventing a parallel
shape. When the harness adds a memory/context schema, `presentMemoryContext`
becomes a real presenter mirroring it.

## Operational States

Each presenter returns `{ status, descriptor, reasons }`. `status` is one of the
operational workbench states, ordered here by display precedence (highest
first). When more than one condition holds — a stale, redacted packet, for
example — the highest-precedence condition is the panel's primary `status`, and
every condition is listed in `descriptor.flags` so the surface can badge them
all.

1. `missing-source` — the ref is absent, or its provenance/source identifiers do
   not validate; the panel cannot be trusted or located.
2. `unsupported` — no resident or display renderer is available for the artifact.
3. `error` — the trace contains a `renderer.error` event.
4. `denied` — a harness-owned policy denial on an action ref.
5. `redacted` — the harness marked evidence as secret-bearing or applied a
   private-payload redaction policy.
6. `stale` — the harness marked evidence `freshnessClass` as `stale`.
7. `empty` — the ref resolved but carries no rows (no commands, no events).
8. `loading` — a lifecycle-only panel declared before its ref resolves.
9. `ready` — the ref is sourced, safe, and renderable.

## Safety And Ownership

- **Inert and display-only.** Every descriptor survives a JSON round-trip,
  carries no callback, and exposes no `executable`/`canExecute: true` capability.
  Action presentation reuses the resident renderer, which already drops any
  forged execution block.
- **No secret leakage.** All echoed values pass through a sanitizer that strips
  unsafe prop keys, drops inline secret-bearing keys, and refuses to echo
  HTML-like or `javascript:` free text from a ref. Evidence redaction state is
  surfaced; secret values are never displayed.
- **No invented data.** Presented identifiers (`artifactViewId`, `artifactId`,
  `evidenceId`, `runId`, `traceId`) are echoed from the source ref, never
  fabricated. Missing or mismatched source data fails closed to an explicit
  operational state instead of a synthesized placeholder.
- **Display configuration, not execution.** `selectRenderer` picks a renderer
  mode the resident vocabulary can show (preferring a resident `studio_ui`
  renderer that points at `@jami-studio/ui`) and reports `unsupported` when none
  qualifies. It never instantiates a renderer.

Policy, approval, tool execution, provenance, memory, and audit decisions stay
owned by Jami Harness. A denial, a redaction policy, or a freshness class is
displayed here, never decided here.

## Contract Source And Checks

- Seam: `packages/renderer/src/presentation.mjs`
- Fixture schema: `packages/renderer/schemas/presentation-fixture.schema.json`
- Fixtures: `packages/renderer/fixtures/presentation/`
- Unit/fixture tests: `packages/renderer/test/presentation.test.mjs`
  (`pnpm --filter @jami-studio/renderer test`)
- Contract gate: `pnpm contracts:check`

`pnpm contracts:check` runs every presentation fixture through the seam and
enforces that each fixture points at the correct harness schema id for its kind
(memory/context excepted, since the harness does not model it), that a ref-backed
kind actually carries a harness ref, that the seam produces exactly the declared
operational status, and that the descriptor leaks no unsafe value. The check and
the package test import the same seam, so the fixture corpus cannot drift from
the code that consumes it.

## Not Yet Claimed

There is no browser, screenshot, or accessibility evidence because there is no
app or workbench surface in this repo yet. The seam produces structured
descriptors only. It does not render React, mount a DOM, map AG-UI event streams,
import harness types, define a memory/context contract, or execute actions.

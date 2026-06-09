---
type: feature
surface: renderer
---

Add the smallest real workbench presentation seam to `@jami-studio/renderer`. The new
`packages/renderer/src/presentation.mjs` module turns harness-originated reference data
into inert, JSON-serializable, display-only presentation descriptors for a dense
operational workbench. It presents `artifactView` (including the harness `trace` and
`evidence` artifact kinds), `evidencePacket`, run-event traces, and `actionRef` data,
annotating each panel with one of the workbench operational states: empty, loading, denied,
redacted, stale, missing-source, unsupported, error, or ready. When several conditions hold
(for example a stale, redacted evidence packet) the highest-precedence state is the panel's
primary status and every condition is listed in the descriptor's `flags`.

The seam is display-only and consumer-side. Action presentation delegates to the resident
renderer so there is no second action path; renderer selection is display configuration
(prefer a resident `studio_ui` renderer, fall back to a plain display mode, report
`unsupported` otherwise) and never instantiates a renderer. Evidence redaction and freshness
are surfaced without echoing secret values, every echoed value passes the shared
`safe-payload` sanitizer, presented identifiers are echoed from the source ref rather than
fabricated, and memory/context refs fail closed to `missing-source` because the harness
contract surface does not model them yet.

Adds a presentation fixture schema, a fixture corpus under
`packages/renderer/fixtures/presentation/` mirroring the harness schema ids, and
`packages/renderer/test/presentation.test.mjs` proving inert, display-only, secret-safe,
no-invented-data behavior. `pnpm contracts:check` now runs every presentation fixture
through the seam and enforces the correct harness schema id per kind, ref presence, the
declared operational status, and no unsafe descriptor values, so the fixtures cannot drift
from the seam that consumes them. Documents the seam in
`docs/architecture/workbench-presentation.md` and records the harness memory/context gap in
`docs/architecture/foundation-alignment.md`.

No browser, workbench app, or app shell exists in this repo yet, so no browser, screenshot,
or accessibility evidence is claimed.

Verification: `pnpm docs:check`, `pnpm contracts:check`, `pnpm contracts:artifacts:check`,
`pnpm --filter @jami-studio/renderer test`, `pnpm --filter @jami-studio/tokens test`,
`pnpm --filter @jami-studio/registry test`, and `git diff --check`. `pnpm verify` fails on
this machine only via the known Node 22 / Windows aggregate lifecycle error
(`ELIFECYCLE ... exit code 4294967295`, engine wants Node >=24); every constituent step
above passes when run directly.

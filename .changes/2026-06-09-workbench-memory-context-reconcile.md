---
type: feature
surface: renderer
---

Reconcile the workbench presentation seam with the harness memory and context
contracts. The harness now models memory and context as `memoryRecord`
(`memory-record.schema.json`) and `contextPack` (`context-pack.schema.json`)
(harness commit `8b5d76c`), so `packages/renderer/src/presentation.mjs` no longer
treats them as unmodeled. `presentMemoryContext` is now a real presenter that
mirrors both contracts behind the single `memoryContext` panel kind,
discriminating on the ref's own identifier (`memoryId` → memory record,
`contextPackId` → context pack) and failing closed to `missing-source` only when
a ref's source identifiers do not validate.

The seam stays display-only and consumer-side. Scope, retention, redaction,
freshness, and inclusion remain harness-owned and are only surfaced here: a
memory record maps `freshness.class: stale` to `stale` and a redacted/private
record to `redacted`, gating its `content` so the payload is never echoed; a
context pack maps an empty `items` set to `empty` and echoes per-item inclusion
reasons and harness-owned drop reasons as display data. Presented identifiers are
echoed from the source ref, never fabricated, and every echoed value still passes
the shared `safe-payload` sanitizer.

Replaces the placeholder `memory-context.missing-source` fixture with a real
memory/context fixture corpus (`memory-record.ready`, `memory-record.redacted`,
`memory-record.stale`, `memory-record.missing-source`, `context-pack.ready`,
`context-pack.empty`), adds the two harness schema ids to the presentation
fixture schema, and updates `scripts/contracts/validate-contracts.mjs` so the
`memoryContext` kind validates against either the `memoryRecord` or `contextPack`
schema id and must carry a harness ref like every other ref-backed kind. Updates
`docs/architecture/workbench-presentation.md`, `docs/architecture/runtime-renderer.md`,
and `docs/architecture/foundation-alignment.md` to record that the memory/context
gap is closed.

No browser, workbench app, or app shell exists in this repo yet, so no browser,
screenshot, or accessibility evidence is claimed.

Verification: `pnpm docs:check`, `pnpm contracts:check`, `pnpm contracts:artifacts:check`,
`pnpm --filter @jami-studio/renderer test`, `pnpm --filter @jami-studio/tokens test`,
`pnpm --filter @jami-studio/registry test`, and `git diff --check`. `pnpm verify` fails on
this machine only via the known Node 22 / Windows aggregate lifecycle error; every
constituent step above passes when run directly.

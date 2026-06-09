# Public Claims Evidence Map

Status: Active
Last updated: 2026-06-09

## Purpose

Every public or outward-facing claim about Studio UI must trace to reproducible
evidence: a generated artifact, a command result, a fixture gate, a package test, or
the workbench accessibility/visual smoke. This map is the register. If a claim is not
in this table with live evidence, it is not safe to make publicly.

## Claim → Evidence

| Public claim | Evidence | How to reproduce |
| --- | --- | --- |
| Token source generates deterministic CSS / Tailwind `@theme` / TS / shadcn `cssVars` | `packages/tokens/generated/*` + drift check | `pnpm contracts:artifacts:check` |
| Registry items validate against the Jami metadata contract | `packages/registry/fixtures/*` + schema gate | `pnpm contracts:check` |
| Registry output is shadcn-shaped with embedded content + `sha256` hashes | `packages/registry/generated/registry.json` | `pnpm registry:publish:check` |
| Every embedded registry content hash recomputes exactly | publish dry-run hash re-verification | `pnpm registry:publish:check` |
| No secret-shaped content in the served registry bundle | publish dry-run secret scan (`secret-shaped content: none`) | `pnpm registry:publish:check` |
| No third-party source is redistributed | all items `copiedSource: false`; dry-run `copiedSourceItems: none` | `pnpm registry:publish:check` |
| Items are MIT-licensed and the repo carries a matching LICENSE | root `LICENSE`; package `license` fields; item `meta.provenance.license` | `pnpm registry:publish:check` (fails if LICENSE missing) |
| The renderer fails closed on unsafe/malformed payloads | renderer fixtures + `safe-payload.mjs` + unit tests | `pnpm --filter @jami-studio/renderer test` |
| Renderer/seam emit inert, non-executable, secret-safe output | `render.test.mjs` / `presentation.test.mjs` | `pnpm --filter @jami-studio/renderer test` |
| The CLI installs/updates/removes/migrates and verifies provenance | 15 temp-project smoke tests | `pnpm --filter @jami-studio/cli test` |
| The CLI provenance command verifies content hashes | `cli provenance <name>` (`state: verified`) | `node packages/cli/bin/studio-ui.mjs provenance jami-theme --registry packages/registry/generated --json` |
| The workbench renders the seams in a browser | static showcase + `node --test` gate | `pnpm --filter @jami-studio/workbench test` |
| The workbench meets structural a11y + contrast targets | a11y/visual smoke report | `node apps/workbench/smoke/a11y-visual-smoke.mjs` |
| The full gate passes | aggregate verify | `pnpm verify` |

## Latest Evidence Snapshot (2026-06-09)

- `pnpm verify` — pass (exit 0), all stages green, including `registry:publish:check`.
- `pnpm registry:publish:check` — `ready-to-stage`; 12 items (12 publishable now,
  0 source-pending); 17 served files; secret-shaped content: none; copied
  third-party source: none.
- `node apps/workbench/smoke/a11y-visual-smoke.mjs` — 14/14 structural a11y, 4/4
  contrast, 5/5 screenshots (Microsoft Edge). Output is gitignored under
  `apps/workbench/output/`.
- Node engine: declared `>=24`; runs succeed on Node 22 with a non-fatal pnpm
  unsupported-engine warning.

## Claims That Are NOT Yet Supported

These must not be stated as fact publicly until evidence exists (see
`docs/operations/release-notes.md` "Not Yet Claimed"):

- A live hosted registry at `registry.jami.studio` or any remote CLI install.
- Any published npm package, or `@jami-studio` scope availability.
- A runtime React renderer, interactive workbench editing, or full suite app shells.
- Specific shadcn/Tailwind version compatibility of the generated source (gated on a
  source-lock record).
- Harness runtime behavior (owned by Jami Harness, only displayed here).
- Any branding or visual-identity claim.

## Cross-Links

- Release notes: `docs/operations/release-notes.md`
- Release and supply chain: `docs/operations/release-and-supply-chain.md`
- Registry publishing: `docs/operations/registry-publishing.md`
- Development workflow (source-registry rule): `docs/operations/development-workflow.md`

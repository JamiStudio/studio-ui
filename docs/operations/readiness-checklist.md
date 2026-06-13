# Readiness Checklist

Status: Active
Last updated: 2026-06-13

## Purpose

This checklist tracks what is ready for Studio UI work and what still needs
setup before specific workstreams begin. It is an operations map, not a product roadmap.

## Ready Now

- Git repository initialized on `main`.
- Remote configured: `https://github.com/studio-jami/studio-ui.git`.
- `main` pushed and tracking `origin/main`.
- Path-lock checked on 2026-06-09: `studio-ui` and sibling `jami-harness` are separate
  registry-root Git worktrees with remotes `https://github.com/studio-jami/studio-ui.git`
  and `https://github.com/studio-jami/jami-harness.git`.
- Root source-lock record checked on 2026-06-09:
  `C:\Users\james\dev\orgs\oss\registry\docs\operations\source-lock-evidence.md`.
- GitHub CLI authenticated as `jamesnavinhill`.
- Vercel CLI authenticated as `studio-jami`.
- No Vercel project is needed for Studio UI or Jami Harness just because
  the repos exist.
- Wrangler installed globally and authenticated to Cloudflare account `jami-studio`.
- Node `v24.16.0` and pnpm `10.33.2` available.
- Minimal pnpm workspace scaffold exists.
- `pnpm docs:check` exists and passes.
- `pnpm contracts:check` exists for token, registry, and renderer compatibility
  fixture foundations.
- `pnpm verify` runs docs and contract checks, generated artifact drift checks,
  the static registry publish readiness dry-run, local release-artifact checks
  (SBOM and generated release-note rollup), and the
  tokens/registry/renderer/cli/workbench package tests.
- `pnpm registry:publish:check` exists (read-only static publish dry-run; current
  status `ready-to-stage`, secret-clean, no copied source). It publishes nothing.
- `pnpm release:artifacts:check` exists and validates
  `docs/generated/sbom.cdx.json` plus `docs/generated/release-notes.md`; it
  publishes nothing and executes no attestation.
- `pnpm hosted:routes:check` exists and validates local preview-hosted route
  artifacts for registry JSON, docs pages, workbench/showcase, and mounted suite
  app/page routes. It publishes nothing, claims no external hosting, and records
  remaining Cloudflare/DNS/live-smoke actions in `hosted-route-manifest.json`.
- `pnpm release:packages:check` exists and validates package manifests, npm pack
  dry-runs, a clean local tarball install, and public npm metadata for the five
  `@jami-studio/*@0.1.0` packages.
- `pnpm hosted:live:check` exists and has passed against
  `https://registry.jami.studio`, including remote CLI install of a theme,
  primitive, page, block, and all four suite roots. The same gate now requires
  the hosted static workbench/showcase route and a hosted suite preview route.
- GitHub release `studio-jami/studio-ui@v0.1.0` exists with
  `studio-ui-v0.1.0.tgz` and checksum assets.
- `pnpm sbom:check` and `pnpm release:notes:check` exist for targeted checks.
- `packages/ui/src/radix-react-wrappers.mjs` implements the local Radix/React
  wrapper slice for all current resident vocabulary items: `button`, `panel`,
  `text-field`, `data-list`, `agent-panel`, `docs-source-panel`, and
  `media-grid`. Only `button` and `text-field` declare Radix Slot/Label package
  dependencies; the other wrappers are plain React display wrappers.
- `packages/ui/src/suites.mjs` implements local mounted React app/page/block
  surfaces for `solo`, `business-ops`, `mixed-media`, and `research-writing`,
  and `apps/workbench/build.mjs` emits static preview route artifacts for them.
  This does not claim external hosted runtime, backend persistence, backend
  registration, harness execution, or renderer payload execution.
- `packages/ui` declares `@radix-ui/react-slot@1.2.5` and
  `@radix-ui/react-label@2.1.9` as dependencies, React `>=19 <20` as a peer,
  and `react@19.2.7` / `react-dom@19.2.7` as local server-render evidence
  dev dependencies.
- Root MIT `LICENSE` exists and root/package `license` fields match item provenance.
- Release/publishing readiness docs exist: `registry-publishing.md`,
  `release-and-supply-chain.md`, `release-notes.md`, `public-claims-evidence.md`.
- `.env.example` exists; `.env` and local secret variants are ignored.
- Changelog fragment system exists under `.changes/`.
- Local-first development workflow exists under `docs/operations/development-workflow.md`.
- Active roadmap exists under `docs/roadmaps/`.
- Durable product shape exists under `docs/architecture/`.
- Account/env lane doc exists under `docs/operations/`.
- Root branding intake exists under `C:\Users\james\dev\orgs\oss\registry\docs\branding\README.md`
  and treats early logo files as exploratory source material, not production brand canon.

## Package Publishing State

- Public npm packages are live at `0.1.0` for `@jami-studio/tokens`,
  `@jami-studio/registry`, `@jami-studio/renderer`, `@jami-studio/cli`, and
  `@jami-studio/ui`.
- `pnpm release:packages:check` validates local package contents and public npm
  metadata, including tarballs, `sha512` integrity, and SLSA provenance metadata.
- Keep the GitHub Actions release workflow as the future package publish path.
- Re-run and review the local machine-readable SBOM before each release. Current
  package graph includes the authored Radix/React wrapper dependencies; see
  `docs/generated/sbom.cdx.json` and `release-and-supply-chain.md`.

## Hosted Registry State

- The registry publishing runbook exists (`docs/operations/registry-publishing.md`)
  and the publish dry-run, local hosted-route artifact smoke, and custom-domain
  live smoke pass.
- `https://registry.jami.studio/registry.json` returns HTTP 200 with JSON content
  and public cache headers.
- Validate the generated output against the official shadcn registry schema URL
  before making a specific shadcn-version compatibility claim.
- Add a repo-local shadcn/Tailwind source-lock record before public generated-source
  compatibility claims.
- Add revisioned-item URL policy to the registry lifecycle doc.
- Keep the clean install smoke against the hosted registry URL current whenever
  hosted artifacts change.
- Keep the repo-local Cloudflare/static-host source-lock row in
  `docs/operations/source-lock-records.md` current before changing hosted route
  generation or route smoke behavior.

## Missing Before Hosted Persistence/Backend Registration

- A dependency-free static workbench exists under `apps/workbench`, with local
  build, unit, headless browser smoke coverage, and a generated static route
  deployed at `https://registry.jami.studio/`.
- No hosted persistence or backend package-registration target is provisioned or
  linked in this repo.
- Add backend deployment runbook before any persisted save/register claim.
- Add deployment env templates after hosted runtime requirements exist.

## Ready Contract Foundations

- `docs/architecture/token-contract.md`
- `docs/architecture/registry-lifecycle.md`
- `docs/architecture/runtime-renderer.md`
- `docs/architecture/compatibility-contract.md`
- `docs/operations/source-lock-records.md`
- `packages/tokens` package scaffold, schema, valid token fixture, and negative
  reference/contrast fixtures.
- `packages/registry` package scaffold, registry item schema, sample `@jami-studio`
  item, and missing-provenance negative fixture.
- `packages/renderer` package scaffold, compatibility schema, fixture mirror for
  `uiPayload`, `artifactView`, denied `actionRef`, `themeRef`, `suiteRef`,
  unsupported components, invalid payloads, and renderer error states.

## Missing Before Implementation Workstreams

- `docs/architecture/workbench-overlay.md`
- `docs/operations/registry-install.md`
- Additional repo-local source-lock records and drift checks for each newly adopted
  drift-prone dependency or copied/recomposed source surface, using the registry-root
  source-lock record as intake evidence. The current Radix Slot/Label and React
  package evidence for the resident wrapper slice and the Cloudflare/static-host
  evidence for hosted route preview artifacts are recorded in
  `docs/operations/source-lock-records.md`.
- Harness-side compatibility fixture export or mirror for `uiPayload`, `artifactView`,
  `actionRef`, `themeRef`, `suiteRef`, unsupported renderer states, invalid payloads,
  denied actions, and renderer error states.
- Evidence packet schema for generated docs, system maps, registry outputs, visual evidence,
  changelog/release notes, and public readiness claims.
- package-level lint/type/test/build scripts
- package-level source/license audit policy for lifted third-party files

## Automation Readiness

- Local first: `pnpm verify` currently runs docs, contract, generated artifact,
  publish dry-run, release-artifact, and package test gates.
- GitHub Actions docs check is manual fallback through `workflow_dispatch`.
- Do not rely on CI as the only gate. Agents must run local checks before pushing.
- Automatic push and pull-request checks can be enabled later when development slows or minutes are no longer constrained.
- Linear/Notion/project-management sync is not configured in this repo yet.

## Current External Setup Gaps

- Hosted persistence/backend registration target and secrets.
- Revisioned registry item URL policy.
- Final brand canon.

## Not Needed Yet

- Runtime databases.
- Cloudflare D1/KV/Queues resources.
- Vercel project env vars.
- Separate Vercel projects for `studio-ui` or `jami-harness` as repo-only
  placeholders.
- Package publishing tokens.
- Private registry auth.

Add those only when the owning workstream creates the runtime or publishing surface.

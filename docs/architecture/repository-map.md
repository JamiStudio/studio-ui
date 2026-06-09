# Repository Map

Status: Active foundation
Last updated: 2026-06-09

## Current Shape

The repo has documentation, roadmap, workspace scaffold, checked contract foundations for
tokens, registry metadata, and renderer compatibility fixtures, deterministic generated
token and registry artifacts, a minimal resident renderer with a workbench presentation
seam, the `@jami-studio/cli` install/config lifecycle that operates on the real generated
registry, and a dependency-free `apps/workbench` static showcase surface that renders the
generated theme, registry/suite descriptors, resident renderer, and presentation seam in a
browser with visual/accessibility evidence plus a local always-live overlay for generated
token edits and deterministic local artifacts. It does not yet contain production UI
components, hosted/persisted workbench editing, backend registration, full suite app shells,
or hosted registry publishing.

## Root

- `AGENTS.md` - operating rules for coding agents.
- `README.md` - entrypoint for humans and agents.
- `package.json` - pnpm workspace root and foundation verification scripts.
- `pnpm-workspace.yaml` - workspace package globs.
- `.env.example` - tracked local env template.
- `.gitignore` - dependency, build, env, and generated-registry ignore rules.
- `.changes/` - changelog fragments.
- `scripts/contracts/validate-contracts.mjs` - local contract fixture validator.
- `scripts/release/publish-dry-run.mjs` - read-only static registry publish
  readiness dry-run (`pnpm registry:publish:check`): hash re-verification, secret
  scan, installable-vs-pending classification. Publishes nothing.
- `scripts/release/generate-release-artifacts.mjs` - local release-artifact
  generator/check (`pnpm release:artifacts:check`) for the CycloneDX SBOM and
  generated `.changes` rollup. Publishes nothing and executes no attestation.
- `LICENSE` - root MIT license matching item provenance.

## Source Areas

- `apps/workbench` - dependency-free static workbench surface over the generated theme,
  registry/suite descriptors, resident renderer, and presentation seam, with a local
  always-live overlay, a node `--test` gate, and a separate headless-browser
  visual/accessibility smoke (`docs/architecture/workbench-showcase.md`). Hosted
  persistence and backend registration are not implemented yet.
- `packages/tokens` - DTCG-compatible token schema, fixtures, and deterministic generated
  CSS/Tailwind/TypeScript/shadcn outputs.
- `packages/registry` - registry item metadata, source items, and deterministic generated
  shadcn-shaped output (with embedded install content/hashes and suite manifests).
- `packages/ui` - resident Radix-first shadcn primitives, components, blocks, pages, and suite shells (not implemented yet).
- `packages/renderer` - structured UI payload compatibility fixtures, the minimal resident
  render core, and the workbench presentation seam; React rendering is not implemented yet.
- `packages/cli` - dependency-free install/config CLI for registry items, themes, and
  suite descriptors, with temp-project smoke tests (`docs/operations/registry-install.md`).
- `registry/` - reserved for authored registry item source (current source items live under
  `packages/registry/fixtures/valid`).
- `tools/` - local helper tooling that does not belong in published packages.

## Docs

- `docs/research/` - dated research and source reports.
- `docs/roadmaps/` - active implementation plans.
- `docs/architecture/` - durable product and technical contracts.
- `docs/operations/` - setup, release, account, env, registry publish, and verification guidance.
  Release/publishing readiness lives in `registry-publishing.md`,
  `release-and-supply-chain.md`, `release-notes.md`, and `public-claims-evidence.md`.
- `docs/generated/` - checked generated release-readiness artifacts:
  `sbom.cdx.json` and `release-notes.md`.
- `docs/engineering/` - reusable engineering standards and orchestration prompts.
- `docs/decisions/` - durable decision records once choices are promoted from reports/plans.

## Generated Or Build Outputs

Checked generated contract artifacts are committed where the owning workstream has
defined a deterministic generation/check command: `packages/tokens/generated`,
`packages/registry/generated`, and `docs/generated`. Transient outputs remain
ignored:

- `public/r/`
- `registry/.generated/`
- package build outputs such as `dist/`, `build/`, `.next/`, and `out/`
- `output/` — local smoke evidence (the workbench screenshots and a11y report)
- `apps/workbench/dist/` is the reproducible static workbench build (`node apps/workbench/build.mjs`)

# Repository Map

Status: Active foundation
Last updated: 2026-06-09

## Current Shape

The repo has documentation, roadmap, workspace scaffold, and the first checked contract
foundations for tokens, registry metadata, and renderer compatibility fixtures. It does
not yet contain production UI components, generated token outputs, registry publishing
output, CLI install flows, or workbench apps.

## Root

- `AGENTS.md` - operating rules for coding agents.
- `README.md` - entrypoint for humans and agents.
- `package.json` - pnpm workspace root and foundation verification scripts.
- `pnpm-workspace.yaml` - workspace package globs.
- `.env.example` - tracked local env template.
- `.gitignore` - dependency, build, env, and generated-registry ignore rules.
- `.changes/` - changelog fragments.
- `scripts/contracts/validate-contracts.mjs` - local contract fixture validator.

## Source Areas

- `apps/workbench` - always-live workbench overlay and showcase app.
- `packages/tokens` - DTCG-compatible token schema and fixture foundations; generated
  outputs are not implemented yet.
- `packages/registry` - registry item metadata and package graph fixture foundations;
  generated shadcn output is not implemented yet.
- `packages/ui` - resident Radix-first shadcn primitives, components, blocks, pages, and suite shells.
- `packages/renderer` - structured UI payload compatibility fixtures and renderer
  schema foundation; React rendering is not implemented yet.
- `packages/cli` - install/config CLI for registry items and suites.
- `registry/` - authored registry item source.
- `tools/` - local helper tooling that does not belong in published packages.

## Docs

- `docs/research/` - dated research and source reports.
- `docs/roadmaps/` - active implementation plans.
- `docs/architecture/` - durable product and technical contracts.
- `docs/operations/` - setup, release, account, env, registry publish, and verification guidance.
- `docs/engineering/` - reusable engineering standards and orchestration prompts.
- `docs/decisions/` - durable decision records once choices are promoted from reports/plans.

## Generated Or Build Outputs

Generated registry output should not be committed until a workstream explicitly defines the
publishing contract. Current ignored paths:

- `public/r/`
- `registry/.generated/`
- package build outputs such as `dist/`, `build/`, `.next/`, and `out/`

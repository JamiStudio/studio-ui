# Readiness Checklist

Status: Active
Last updated: 2026-06-09

## Purpose

This checklist tracks what is ready for Studio UI work and what still needs
setup before specific workstreams begin. It is an operations map, not a product roadmap.

## Ready Now

- Git repository initialized on `main`.
- Remote configured: `https://github.com/JamiStudio/studio-ui.git`.
- `main` pushed and tracking `origin/main`.
- Path-lock checked on 2026-06-09: `studio-ui` and sibling `jami-harness` are separate
  registry-root Git worktrees with remotes `https://github.com/JamiStudio/studio-ui.git`
  and `https://github.com/JamiStudio/jami-harness.git`.
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
- `pnpm verify` runs docs and contract checks.
- `.env.example` exists; `.env` and local secret variants are ignored.
- Changelog fragment system exists under `.changes/`.
- Local-first development workflow exists under `docs/operations/development-workflow.md`.
- Active roadmap exists under `docs/roadmaps/`.
- Durable product shape exists under `docs/architecture/`.
- Account/env lane doc exists under `docs/operations/`.
- Root branding intake exists under `C:\Users\james\dev\orgs\oss\registry\docs\branding\README.md`
  and treats early logo files as exploratory source material, not production brand canon.

## Missing Before Package Publishing

- npm is not authenticated. `npm whoami` returns `ENEEDAUTH`.
- Confirm package access policy for `@jami-studio/*`.
- Add package publishing runbook once package names and release tooling exist.

Commands:

```powershell
npm adduser
npm whoami
```

## Missing Before Hosted Registry Publishing

- Add `registry.jami.studio` as the static registry distribution endpoint.
- Publish generated registry output to a static host. Preferred first target:
  Cloudflare Pages or equivalent Cloudflare static hosting under the existing
  `jami-studio` account.
- Add registry publish runbook after `packages/registry` can generate output.
- Add cache/revision policy to the registry lifecycle doc.
- Add clean install smoke against the hosted registry URL.

## Missing Before App Deployment

- No app exists yet under `apps/workbench`.
- No Vercel project is linked in this repo yet, and none is needed until an actual app
  surface exists.
- Add app deployment runbook after the workbench scaffold exists.
- Add deployment env templates after runtime requirements exist.

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
- Additional repo-local source-lock records and drift checks for each adopted drift-prone
  dependency or copied/recomposed source surface, using the registry-root source-lock
  record as intake evidence.
- Harness-side compatibility fixture export or mirror for `uiPayload`, `artifactView`,
  `actionRef`, `themeRef`, `suiteRef`, unsupported renderer states, invalid payloads,
  denied actions, and renderer error states.
- Evidence packet schema for generated docs, system maps, registry outputs, visual evidence,
  changelog/release notes, and public readiness claims.
- package-level lint/type/test/build scripts
- package-level source/license audit policy for lifted third-party files

## Automation Readiness

- Local first: `pnpm verify` currently runs `pnpm docs:check` and `pnpm contracts:check`.
- GitHub Actions docs check is manual fallback through `workflow_dispatch`.
- Do not rely on CI as the only gate. Agents must run local checks before pushing.
- Automatic push and pull-request checks can be enabled later when development slows or minutes are no longer constrained.
- Linear/Notion/project-management sync is not configured in this repo yet.

## Current External Setup Gaps

- npm publishing auth.
- package scope/access confirmation for `@jami-studio`.
- workbench deployment target decision after app scaffold.

## Not Needed Yet

- Runtime databases.
- Cloudflare D1/KV/Queues resources.
- Vercel project env vars.
- Separate Vercel projects for `studio-ui` or `jami-harness` as repo-only
  placeholders.
- Package publishing tokens.
- Private registry auth.

Add those only when the owning workstream creates the runtime or publishing surface.

# Readiness Checklist

Status: Active
Last updated: 2026-06-07

## Purpose

This checklist tracks what is ready for Studio UI Registry work and what still needs
setup before specific workstreams begin. It is an operations map, not a product roadmap.

## Ready Now

- Git repository initialized on `main`.
- Remote configured: `https://github.com/JamiStudio/studio-ui-registry.git`.
- `main` pushed and tracking `origin/main`.
- GitHub CLI authenticated as `jamesnavinhill`.
- Vercel CLI authenticated as `studio-jami`.
- No Vercel project is needed for Studio UI Registry or Jami Agent Harness just because
  the repos exist.
- Wrangler installed globally and authenticated to Cloudflare account `jami-studio`.
- Node `v24.16.0` and pnpm `10.33.2` available.
- Minimal pnpm workspace scaffold exists.
- `pnpm docs:check` exists and passes.
- `.env.example` exists; `.env` and local secret variants are ignored.
- Changelog fragment system exists under `.changes/`.
- Active roadmap exists under `docs/roadmaps/`.
- Durable product shape exists under `docs/architecture/`.
- Account/env lane doc exists under `docs/operations/`.

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

## Missing Before Implementation Workstreams

- `docs/architecture/token-contract.md`
- `docs/architecture/registry-lifecycle.md`
- `docs/architecture/workbench-overlay.md`
- `docs/architecture/runtime-renderer.md`
- `docs/operations/registry-install.md`
- package-level lint/type/test/build scripts
- package-level source/license audit policy for lifted third-party files

## Automation Readiness

- Local first: `pnpm verify` currently maps to `pnpm docs:check`.
- GitHub Actions docs check should run the same foundation check on pull requests and pushes.
- Do not rely on CI as the only gate. Agents should run local checks before pushing.
- Linear/Notion/project-management sync is not configured in this repo yet.

## Current External Setup Gaps

- npm publishing auth.
- package scope/access confirmation for `@jami-studio`.
- workbench deployment target decision after app scaffold.

## Not Needed Yet

- Runtime databases.
- Cloudflare D1/KV/Queues resources.
- Vercel project env vars.
- Separate Vercel projects for `studio-ui-registry` or `jami-agent-harness` as repo-only
  placeholders.
- Package publishing tokens.
- Private registry auth.

Add those only when the owning workstream creates the runtime or publishing surface.

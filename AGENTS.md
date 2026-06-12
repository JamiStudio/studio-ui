# AGENTS.md - Studio UI operating rules

Today is June 2026. Do not rely on outdated training knowledge. There have been significant security, patterns, and best-practice updates that must be adopted. ALWAYS use official UP-TO-DATE sources.

Studio UI is the Jami.Studio primitive registry, token system, workbench overlay,
CLI install surface, runtime renderer, and installable suite-pack foundation. Read this
before editing.

Canonical repo identity: `studio-ui` at `https://github.com/studio-jami/studio-ui.git`.

## Source of truth

1. **The live code**: package source, token schemas, registry item source, generated
   registry output, CLI commands, renderer contracts, tests, and scripts own executable truth.
2. **Architecture docs** (`docs/architecture/`) explain ownership, data flow, registry
   lifecycles, token generation, workbench state, install flows, and runtime rendering.
3. **Decision records** (`docs/decisions/`) record durable choices and their rationale.
4. **Source reports** (`docs/research/`) explain dated research and feasibility findings.
   The current foundation report is `docs/research/studio-ui-feasibility-report.md`.
5. **Foundation alignment** (`docs/architecture/foundation-alignment.md`) records the
   sibling boundary with `C:\Users\james\dev\orgs\oss\registry\jami-harness`.
6. **Development workflow** (`docs/operations/development-workflow.md`) owns local-first
   verification, manual CI posture, source-registry expectations, changelog, diagramming,
   and no-stub escalation rules.
7. **Active roadmap** (`docs/roadmaps/`) is a guide, not proof. Verify against live code.

Never treat a brainstorm, report, or dated plan as implemented behavior unless code and
checks confirm it.

## Owned surfaces

- `packages/tokens` - DTCG-compatible source tokens, factory themes, validation, generated
  CSS variables, Tailwind theme variables, TypeScript types, and shadcn `cssVars` payloads.
- `packages/registry` - registry item metadata, dependency graph, Jami extensions, shadcn
  item generation, and registry JSON output.
- `packages/ui` - resident Radix-first shadcn primitives, components, blocks, page pieces,
  and suite shell UI.
- `packages/renderer` - structured UI payload validation, resident allowlist lookup,
  vocabulary-generation handling, action references, and graceful fallback.
- `packages/cli` - install/config commands for themes, primitives, pages, apps, and suites.
- `apps/workbench` - always-live workbench overlay, status bar, docked controls, inspector
  focus, save/duplicate/restore/register/export flows, and Jami.Studio showcase surface.
- `registry/` - authored registry source items and suite packs.
- `docs/` - program docs, engineering standards, architecture, operations, decisions,
  active roadmaps, and research.

## Sibling boundary

`studio-ui` stays separate from `jami-harness`. Keep them cohesive through
typed contracts and cross-links, not duplicated roadmaps or collapsed ownership.

This repo owns tokens, UI primitives, registry items, resident rendering, workbench
controls, suite packs, and UI install/config flows. Jami Harness owns agent runs,
tools, policy, approvals, memory, artifacts, traces, evidence, runtime state, and
agent-facing CLI/SDK surfaces.

When a UI payload, artifact view, action ref, theme ref, or suite ref contract changes,
update `docs/architecture/foundation-alignment.md` and the matching harness doc. Do not
move policy execution, tool invocation, memory writes, or trace ownership into this repo.

## Product rules

- Build the full production target described by the active roadmap. Do not use launch-stage
  framing or watered-down product language in planning or durable docs.
- shadcn is the build-time distribution mechanism. It does not render runtime payloads in
  the request path.
- Runtime UI payloads are data, never code. The renderer uses resident allowlisted
  components, Zod or equivalent schema validation, and graceful fallback.
- Harness-originated UI arrives as typed payload/action/artifact references. Display and
  configuration belong here; policy execution and tool side effects stay in the harness.
- Token source owns visual truth. CSS and TypeScript outputs are generated or mechanically
  derived from the token model.
- Theme editing is always live. Save persists; restore returns to factory state. Do not add
  a preview/live toggle.
- Configuration controls belong in the workbench overlay, not scattered across product pages.
- The first primitive base is Radix-first shadcn. Base UI compatibility is a later extension.
- The registry uses one public `@jami-studio` namespace unless a later decision record changes it.

## Hard rules

- **Adapters for every external dependency** once runtime integrations exist. Provider logic
  stays behind explicit ports and never leaks into registry, UI, renderer, or token contracts.
- **No mocks, placeholders, broad compatibility shims, or hidden demo data.** Later-plan work
  is explicit and verifiable, not faked.
- **No unchecked source lifting** from Builder.io / Agent-Native or any reference corpus.
  Verify license scope, attribution, source path, and current upstream state before copying.
- **Secrets** live only in host secret stores, local gitignored env files, or provider
  dashboards. `.env.example` is the only tracked env template. Never write secrets into
  code, docs, registry items, generated artifacts, fixtures, screenshots, logs, or output.
- **Drift-prone facts** about shadcn, Tailwind, DTCG, Agent-Native, package versions,
  providers, protocols, pricing, or licensing must be verified against official sources
  before durable docs or code lock them in.

## Verification ladder

Run the narrowest complete set for what changed. `pnpm verify` is the full gate once the
package scaffold owns it.

- Docs-only: `pnpm docs:check` and `git diff --check`
- Tokens: token validation, generation, typecheck, and unit tests
- Registry: shadcn schema validation, Jami metadata validation, dependency graph tests,
  and output snapshot checks
- UI/workbench: lint, typecheck, unit tests, build, and browser smoke when the app exists
- Renderer: payload schema tests, allowlist tests, invalid-prop fallback tests, and
  injection guard tests
- CLI: dry-run, diff, install, and clean temporary-project smoke tests
- Full gate: `pnpm verify`

If a command cannot run because the surface does not exist yet, say that directly.
GitHub Actions are manual fallback while minutes are limited. Do not push unverified work and expect CI to catch it.

## Docs and changelog

- Active plans live in `docs/roadmaps/`; completed dated plans retire to
  `docs/_legacy/roadmaps/` after durable rules are promoted.
- Feasibility and research reports live in `docs/research/`.
- Durable architecture and operations rules live in `docs/architecture/` and `docs/operations/`.
- Add a `.changes/` fragment when production-meaningful code, docs, scripts, package
  metadata, CI, security, operations, registry behavior, or release behavior changes.
- Keep durable docs describing actual behavior, not aspirational status.

## Account and secret lanes

Keep these separate:

- **Automation/operator scope**: credentials and connected tools agents need to execute
  development and deployment work, such as GitHub, Vercel, npm, Cloudflare, and provider CLIs.
- **Runtime/app secrets**: values future packages or apps read at runtime. These stay in
  `.env` or provider secret stores and are never copied into tracked files.

Use `docs/operations/account-and-env-lanes.md` for safe account status and env-source
references. Do not inspect or paste secret values into docs.

## Closeout

Before final response:

- Stop helper processes started during the session.
- Confirm no secrets were written to tracked files or command output artifacts.
- Keep roadmap, durable docs, and changelog fragments accurate.
- Leave unrelated dirty/untracked files untouched.
- Report verification run and result.
- Report commands that could not run because the surface does not exist yet.
- Stage only intentional changes.
- Use a conventional commit subject and body.
- Push to `origin/main` when the repo has a configured remote.

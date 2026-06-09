# Studio UI Production Shape Implementation Plan

Date: 2026-06-07
Status: Active - repo foundation in progress
Source reports: `docs/research/studio-ui-feasibility-report.md`; crossflow adversarial review at `C:\Users\james\dev\orgs\oss\registry\docs\research\2026-06-08-harness-ui-plan-adversarial-review.md`
Owner: Jamie / Jami.Studio
Surface: Jami.Studio Studio UI foundation: registry, token system, workbench overlay, CLI, suite packs, and runtime renderer
Sibling foundation: `C:\Users\james\dev\orgs\oss\registry\jami-harness`

## Purpose

Build the full Jami.Studio Studio UI foundation: an owned shadcn-compatible registry, DTCG-compatible token system, always-live workbench overlay, package/save/register flows, CLI install path, resident runtime renderer, and four installable suite lanes: solo/general workflow, business ops, mixed-media, and research/writing.

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Needs owner decision or external setup

## Source Findings

- `docs/research/studio-ui-feasibility-report.md` recommends the full Studio UI system: owned shadcn registry, DTCG-compatible token source, workbench overlay, one `@jami-studio` namespace, and four suite lanes.
- The B-agent-substrate render-seam source report establishes the split between build-time shadcn registry distribution and runtime resident allowlisted rendering.
- The Agent-Native appearance audit identifies the Builder.io / Agent-Native template gap: repeated template-local shadcn copies and no shared primitive registry.
- `docs/research/master/audits/12-agent-native/deep-dives/shadcn-as-agent-registry.md` confirms shadcn registry, namespace, MCP, and token mechanisms as the right distribution base.
- `docs/architecture/foundation-alignment.md` records the repo split: Studio UI owns UI, token, renderer, registry, workbench, suite, and UI install surfaces; Jami Harness owns governed agent execution, tools, policy, memory, artifacts, traces, and agent-facing runtime surfaces.
- Crossflow adversarial review requires path-lock, current-source lock, shared compatibility fixtures,
  renderer negative tests, UI lifecycle commands, accessibility/visual gates, and early provenance checks
  before implementation expands from docs into product packages.
- Yrka reference surfaces under `C:\Users\james\projects\yrka\packages\design-tokens`, `C:\Users\james\projects\yrka\apps\web\lib\theme`, and `C:\Users\james\projects\yrka\apps\web\components\admin\dock` are the preferred local influence for dense, always-live, orderly theme controls.
- Current checkout has docs, research, package/source-control scaffold, and repo-readiness guidance. Product packages are not implemented yet.
- 2026-06-09 path-lock evidence confirms `studio-ui` and `jami-harness` are separate registry-root Git
  worktrees with canonical `JamiStudio` remotes; the sibling harness worktree had an unrelated dirty
  deletion during this Studio UI pass and was not edited here.
- Registry-root source-lock evidence is current at
  `C:\Users\james\dev\orgs\oss\registry\docs\operations\source-lock-evidence.md`; Studio UI
  implementation work still needs repo-local source-lock records before code depends on those sources.
- Registry-root branding intake treats current logo files as exploratory source material, not production
  brand canon or token/registry/UI source truth.
- 2026-06-09 Stream 2 pass 1 added the first machine-readable contract spine:
  `packages/tokens`, `packages/registry`, `packages/renderer`, and `scripts/contracts/validate-contracts.mjs`.
  `pnpm contracts:check` validates token references/contrast/output declarations, registry lifecycle
  and provenance metadata, and renderer compatibility fixtures for `uiPayload`, `artifactView`,
  denied `actionRef`, `themeRef`, `suiteRef`, unsupported components, invalid payloads, and renderer
  error states. Generated token outputs, public shadcn registry output, React renderer code, and CLI
  install flows are still pending.
- 2026-06-09 Stream 2 pass 2 hardened the renderer fixture mirror against the concurrent harness
  contract spine by adding harness schema IDs, shared reference ID patterns, denied-action
  non-execution checks, renderer-error run-event mirrors, and malformed-reference negative coverage.
  This remains consumer-side contract validation only; Studio UI still does not import harness
  implementation internals or claim harness runtime execution.
- 2026-06-09 Stream 2 pass 4 added deterministic contract artifact generation for token CSS,
  Tailwind `@theme`, TypeScript token-name exports, shadcn `cssVars`, and local shadcn-shaped
  registry output under `packages/*/generated`. `pnpm contracts:check` now drift-checks those
  artifacts and enforces real SHA-256 source hashes on registry source items.
- 2026-06-09 Stream 3 pass 1 hardened the renderer-safe payload boundary. The renderer
  compatibility check now fails closed on event-handler props, `dangerouslySetInnerHTML`,
  `javascript:` URLs, foreign component namespaces, serialized React-element markers, and
  inline secret-bearing props, and it adds a non-executable `pending_approval` action-display
  fixture. This stays consumer-side contract validation only: Studio UI displays typed denied
  and approval states but does not execute harness policy or tool side effects.
- 2026-06-09 Stream 3 pass 2 closed two fail-open gaps in the same contract check without
  widening the resident vocabulary or claiming any runtime renderer. Each fixture kind is now
  pinned to its required renderer state, so a denied or pending-approval action can no longer
  be mislabeled as a renderable surface, and the event-handler guard now rejects lowercase
  HTML handler attributes (`onclick`/`onerror`/`onload`) in addition to React-style casing.
  This remains consumer-side fixture validation; no React renderer, browser surface, or
  harness execution is implemented.
- 2026-06-09 Stream 3 pass 3 added the smallest real resident renderer surface in
  `packages/renderer/src`. It is a dependency-free, framework-agnostic render core that turns
  a validated payload into an inert, JSON-serializable render tree from the resident allowlist:
  valid `uiPayload`s render to resident components; denied/pending-approval/`artifactView`/
  `themeRef`/`suiteRef` references render display-only with no executable capability; unknown
  components degrade to `unsupported`; unsafe or malformed payloads fail closed to `invalid`;
  renderer faults render `error`. The allowlist, secret-key set, and unsafe-payload scan now
  live in one shared `safe-payload.mjs` guard imported by both the renderer and
  `validate-contracts.mjs`, so the fixture gate and the renderer cannot drift. `node --test`
  unit/fixture tests prove inert output, fail-closed negatives, and no executable callbacks.
  This is still not a React renderer, browser surface, or workbench app.
- 2026-06-09 Stream 4 pass 1 added the smallest real workbench presentation seam in
  `packages/renderer/src/presentation.mjs`. It turns harness-originated `artifactView`
  (including the `trace` and `evidence` artifact kinds), `evidencePacket`, run-event
  traces, and `actionRef` data into inert, JSON-serializable, display-only presentation
  descriptors annotated with dense workbench operational states: empty, loading, denied,
  redacted, stale, missing-source, unsupported, error, and ready. Renderer selection is
  display-only configuration (prefer a resident `studio_ui` renderer, fall back to a plain
  display mode, report `unsupported` otherwise); it never instantiates a renderer. Evidence
  redaction and freshness are surfaced without echoing secret values, presented identifiers
  are echoed from the source ref rather than fabricated, and memory/context refs fail closed
  to `missing-source` because the harness does not model them yet. `pnpm contracts:check`
  now runs every presentation fixture through the seam and enforces shared harness schema
  ids, ref presence, the declared operational status, and no unsafe descriptor values;
  `packages/renderer/test/presentation.test.mjs` proves inert, display-only, secret-safe,
  no-invented-data behavior. This is still not a React renderer, browser surface, or
  workbench app, and no browser/accessibility evidence is claimed.
- 2026-06-09 Stream 4 pass 2 reconciled the presentation seam with the harness memory
  and context contracts. The harness now models them as `memoryRecord`
  (`memory-record.schema.json`) and `contextPack` (`context-pack.schema.json`), so
  `presentMemoryContext` became a real presenter mirroring both behind the single
  `memoryContext` panel kind (discriminating on `memoryId` vs `contextPackId`) instead
  of failing closed because they were unmodeled. Scope, retention, redaction, freshness,
  and inclusion stay harness-owned and display-only here; a redacted/private memory
  record gates its `content`, a stale record maps to `stale`, and an empty context pack
  maps to `empty`. A ref whose source identifiers do not validate still fails closed to
  `missing-source`. The presentation fixture corpus, fixture schema, and
  `validate-contracts.mjs` were updated to cover both contracts. Still not a React
  renderer, browser surface, or workbench app; no browser/accessibility evidence claimed.

## Locked Decisions

- The registry uses one public `@jami-studio` namespace. Suite identity lives in item names and metadata.
- The first primitive base is Radix-first shadcn. Base UI remains a later compatible family, not the first default.
- Token source is DTCG-compatible JSON, generated into CSS variables, Tailwind theme variables, TypeScript types, shadcn `cssVars`, docs, and workbench control schemas.
- Theme editing is always live. There is no staged apply flow and no preview/live toggle.
- The theme workbench is an overlay over the real app/page: compact status bar, collapsible docked panels, optional inspector focus, retained navigation, close/reopen behavior, and explicit Save.
- The Jami factory theme family uses soft warm muted tones, warm backgrounds, `#C14D84` as the likely anchor accent, and rich blue-green support ranges instead of lime/yellow-green.
- Suite lanes are `solo`, `business-ops`, `mixed-media`, and `research-writing`.
- Builder.io / Agent-Native templates are a reference corpus to recompose, not untouched apps to redistribute.
- Studio UI and Jami Harness remain separate sibling repos. Cohesion comes from shared typed contracts and cross-links, not from merging planning work into one repository.
- `registry.jami.studio` is the static generated registry distribution endpoint. It is not the workbench, showcase app, or marketing site, and it does not require a Vercel project placeholder.

## Scope Boundaries

- No secrets in tracked files, docs, registry metadata, generated artifacts, fixtures, or logs.
- shadcn is install/build distribution only. It does not render runtime UI payloads.
- Runtime UI rendering uses resident allowlisted components and validated structured payloads.
- Harness-originated UI is a typed payload/action/artifact reference lane. Harness does not provide arbitrary React, HTML, scripts, package imports, or unvalidated runtime UI.
- Policy, approval, tool execution, memory writes, traces, and artifact provenance belong to Jami Harness. Studio UI may display and configure surfaces for them, but it does not own those runtime decisions.
- Third-party or generated iframe UI remains an untrusted lane.
- The registry foundation must run locally and avoid paid runtime dependencies.
- Hosted registry publishing targets static generated output first, preferably through Cloudflare static hosting under the existing `jami-studio` account.
- Registry items may include example env vars only when they are blank, development-safe, and documented as non-production placeholders.

## Repo Guidance

- Follow `AGENTS.md` and `docs/engineering/standards/*`.
- Use `docs/research/` for dated feasibility/source reports.
- Use `docs/roadmaps/` for active implementation plans.
- Use `.changes/` for production-meaningful fragments.
- Keep durable architecture and operations docs under `docs/architecture/` and `docs/operations/`.
- Verify drift-prone shadcn, Tailwind, DTCG, Agent-Native, package, provider, and licensing facts against official sources before locking them into durable docs or code.
- Keep generated outputs mechanically reproducible. Source token JSON and registry source items own truth.
- Preserve cross-repo alignment by linking sibling docs instead of duplicating full plans. When a shared contract changes, update `docs/architecture/foundation-alignment.md` here and the matching harness doc.

## Target Product Shape

- `packages/tokens` owns source token schemas, factory themes, validation, generation, and type exports.
- `packages/registry` owns registry item metadata, dependency graphs, shadcn item generation, package manifests, and registry JSON output.
- `packages/ui` owns resident primitives, components, blocks, page building blocks, and suite shell components.
- `packages/renderer` owns runtime payload schema validation, vocabulary generation handling, allowlist lookup, graceful fallback, and action references.
- `packages/cli` owns install/config flows for app title, selected suite, theme, registry URL, and optional defaults.
- `apps/workbench` owns the always-live overlay, status bar, docked control panels, inspector focus, save/register/export flows, and the showcase experience.
- `registry/` owns authored registry item source.
- `docs/architecture/` owns durable contract explanations.
- `docs/operations/` owns account, env, release, and registry publishing instructions.

## Sibling Foundation Boundary

`studio-ui` and `jami-harness` are separate `@jami-studio/*`
foundation repositories.

Studio UI owns tokens, UI primitives, registry packaging, suite composition,
resident rendering, the always-live workbench, and UI install/config flows.

Jami Harness owns agent runs, tools, policy, approvals, memory, artifacts, traces,
evidence, runtime state, and agent-facing CLI/SDK surfaces.

Shared integration is contract-first:

- `uiPayload` for validated resident rendering.
- `artifactView` for harness artifacts rendered through trusted UI components.
- `actionRef` for policy-gated agent/tool actions exposed by UI slots.
- `themeRef` for factory/custom theme references.
- `suiteRef` for suite install graphs and optional harness capabilities.

Do not duplicate the harness roadmap in this repo. Link to the sibling plan and update
shared contract docs when integration decisions change.

## Cross-Stream Dependency Map

- Workstream 1 feeds every other stream by making the repo safe and navigable.
- Workstream 2 token contract feeds Workstreams 3, 4, 5, 6, and 7.
- Workstream 3 registry contract consumes token outputs and feeds CLI, suite packages, and registry publishing.
- Workstream 4 UI primitives consume token outputs and feed renderer, suite packs, and workbench.
- Workstream 5 workbench consumes tokens, registry metadata, and primitives.
- Workstream 6 renderer consumes primitives and registry manifests.
- Workstream 6 also defines the UI side of the shared harness payload/action/artifact seam.
- Workstream 7 CLI consumes registry and token package outputs.
- Workstream 8 suite packs consume all preceding product contracts.
- Workstream 9 verification and release consumes every shipped surface.

## Adversarial Hardening Gates

These gates convert the crossflow adversarial review into execution criteria. They are part of the
active plan, not optional research notes.

- `path-lock`: active plans and boundary docs must point to `C:\Users\james\dev\orgs\oss\registry\studio-ui`
  and `C:\Users\james\dev\orgs\oss\registry\jami-harness`, with package names kept distinct from repo
  folder names; closure requires search/readback or equivalent path-lock evidence.
- `source-lock`: shadcn, Tailwind, DTCG, Radix/Base UI, Agent-Native references, package publishing,
  static registry hosting, and lifted third-party source need current-source, license, and provenance
  evidence before implementation relies on them. The root current-source record is
  `C:\Users\james\dev\orgs\oss\registry\docs\operations\source-lock-evidence.md`; implementation rows
  must become checked-in source-lock records before code depends on the source.
- `compat-lock`: `uiPayload`, `artifactView`, `actionRef`, `themeRef`, `suiteRef`, unsupported component,
  invalid payload, denied action, and renderer error fixtures must align with the harness and be enforced
  by schema/fixture commands once those commands exist.
- `policy-lock`: renderer and action surfaces must include denied-action, approval/refusal display,
  unsafe payload, secret-redaction, and no-side-effect fixtures that preserve harness-owned policy
  decisions.
- `adapter-lock`: AG-UI and any registry/CLI/provider adapter claims must document support,
  unsupported states, denial behavior, trace/evidence mapping, auth expectations, and cancellation or
  streaming limitations where applicable.
- `token-lock`: token fixtures must cover schema version, aliases, invalid references, deprecation,
  composite tokens, dark/light parity, contrast, and generated output determinism.
- `renderer-lock`: runtime rendering is data-only, resident, allowlisted, validated, and failing-closed.
- `cli-lifecycle-lock`: CLI work must cover install, update, remove, migrate, doctor, pin/lock, rollback
  guidance, conflict handling, and provenance inspection.
- `a11y-visual-lock`: component, workbench, renderer, and suite work must prove keyboard, focus, ARIA,
  contrast, reduced motion, responsive, long-content, and multi-theme behavior.
- `evidence-lock`: registry, token, renderer, workbench, suite, docs, and public-claim outputs must link
  to source commit, accepted contract, command result, timestamp, freshness class, and generated output
  paths once evidence schemas exist.
- `supply-chain-lock`: source/license provenance, registry item hashes, SBOM policy, and publish/attestation
  readiness start before suite and release expansion; package publishing, static registry hosting, and
  release attestation tooling need dry-run or capability evidence before public claims.

## Workstream 1: Repo Foundation And Docs Alignment

Goal: Make the repository ready for real work with project-specific durable docs, source-control hygiene, changelog rules, and safe account/env references.

Depends on:

- [x] Feasibility report authored under `docs/research/`.

Enables:

- [ ] Every later workstream can run without rediscovering repo rules or account lanes.

Repo guidance:

- Preserve engineering rules and flows; refresh only project-specific references.

Primary areas:

- `AGENTS.md`
- `docs/engineering/`
- `docs/operations/`
- `.changes/`
- root package/source-control files

Implementation tasks:

- [x] Refresh `AGENTS.md` for Studio UI ownership and verification.
- [x] Refresh `docs/engineering/agents/goal.md` for this project and active roadmap.
- [x] Refresh orchestration reliability guidance with project-specific checkpoint fields while preserving the polling workflow.
- [x] Add changelog fragment rules and `.changes/` scaffold.
- [x] Add account/env lane documentation without copying secrets.
- [x] Add minimal package/source-control scaffold.
- [x] Add sibling foundation alignment doc and cross-repo boundary rules.
- [x] Normalize active plan sibling path to the registry-root `jami-harness` checkout.
- [x] Confirm all active roadmap and boundary docs are path-locked to the actual sibling repos.

Exit criteria:

- [x] All Intercal-specific repo ownership references are removed from active operating docs.
- [x] Agents can find the active roadmap, report, account/env lanes, and changelog rules.
- [x] Git/package scaffolding exists and docs-only checks run.
- [x] No active plan or boundary doc points at legacy sibling paths outside the registry root.

Suggested verification:

- `pnpm docs:check`
- `git diff --check`

## Workstream 2: Token Contract And Factory Theme System

Goal: Define the DTCG-compatible source token model and generate web/runtime outputs for the Jami theme family.

Depends on:

- [x] Workstream 1 complete.

Enables:

- [ ] Workstream 3 registry items can declare token requirements.
- [ ] Workstream 4 primitives can consume stable tokens.
- [ ] Workstream 5 workbench can edit typed token sections.

Repo guidance:

- Source tokens own truth. CSS and TypeScript outputs are generated.

Primary areas:

- `packages/tokens`
- `docs/architecture/token-contract.md`

Implementation tasks:

- [~] Define token source schema for color, semantic, chart, typography, spacing, radius, shadow, motion, density, shell, and component-state tokens.
- [~] Record the current DTCG source-lock, schema version, and migration posture before token schemas are treated as durable.
- [~] Add factory theme definitions for the warm Jami family anchored around `#C14D84`.
- [ ] Add rich blue-green support ramps and explicitly exclude lime/yellow-green factory ranges.
- [x] Generate CSS variables, Tailwind `@theme` variables, TypeScript types, and shadcn `cssVars` payloads.
- [~] Add validation for token completeness, references, contrast, and dark/light parity.
- [~] Add fixtures for aliases, invalid references, deprecated tokens, composite tokens, contrast failures, and deterministic generated outputs.

Exit criteria:

- [ ] A factory token set can generate all runtime outputs reproducibly.
- [ ] Token validation catches missing semantics and broken references.
- [ ] Token source data carries schema version and migration metadata.

Suggested verification:

- `pnpm contracts:check`
- `pnpm test --filter @jami-studio/tokens`
- `pnpm build --filter @jami-studio/tokens`

## Workstream 3: Registry Contract And Package Graph

Goal: Build the shadcn-compatible registry item contract and package graph around one `@jami-studio` namespace.

Depends on:

- [~] Workstream 2 token contract foundations.

Enables:

- [ ] Workstream 7 CLI installation.
- [ ] Workstream 8 suite packaging.

Repo guidance:

- shadcn registry output is build-time distribution, not runtime rendering.

Primary areas:

- `packages/registry`
- `registry/`
- `docs/architecture/registry-lifecycle.md`

Implementation tasks:

- [~] Define registry item metadata for item type, suite, token requirements, dependencies, docs, version generation, and agent manifest.
- [~] Add lifecycle and provenance metadata for item id, version, suite membership, schema version, source hash, install paths, dependencies, compatibility ranges, and migration notes.
- [~] Generate valid `registry.json` and `registry-item.json` outputs.
- [~] Add item types for primitives, components, blocks, pages, themes, fonts, apps, and suites.
- [ ] Add cache/revision naming policy.
- [~] Add schema validation and sample items.

Exit criteria:

- [~] Sample registry items validate against local shadcn-shaped output and Jami metadata rules.
- [ ] `@jami-studio` item names are discoverable and deterministic.
- [ ] Registry items are inspectable for provenance and future migration before CLI work consumes them.

Suggested verification:

- `pnpm contracts:check`
- `pnpm contracts:generate`
- `pnpm contracts:artifacts:check`
- `pnpm test --filter @jami-studio/registry`
- `pnpm build --filter @jami-studio/registry`

## Workstream 4: Primitive And Component Vocabulary

Goal: Establish the resident UI vocabulary that every suite and runtime payload uses.

Depends on:

- [ ] Workstream 2 token outputs.
- [ ] Workstream 3 registry item contract.

Enables:

- [ ] Workstream 5 workbench surfaces.
- [ ] Workstream 6 runtime renderer.
- [ ] Workstream 8 suite packages.

Repo guidance:

- Build on shadcn/Radix primitives. Do not invent a new component substrate.

Primary areas:

- `packages/ui`
- `registry/primitives`
- `registry/components`

Implementation tasks:

- [ ] Define primitive inventory and import boundaries.
- [ ] Add tokenized primitive implementations.
- [ ] Add composed components for agent panel, data display, forms, calendar shell, docs shell, media grid, source board, and command/action surfaces.
- [ ] Add Storybook-like or workbench-compatible examples once the workbench scaffold exists.
- [ ] Add accessibility, interaction, and visual regression checks for critical primitives.
- [ ] Add state fixtures for keyboard, focus visibility, ARIA names/states, contrast, reduced motion, responsive layout, disabled, loading, invalid, empty, error, and long-content behavior.
- [ ] Add source/license provenance review before lifted third-party source is redistributed.

Exit criteria:

- [ ] Primitive and component vocabulary is tokenized and registry-addressable.
- [ ] Component-local hardcoded colors are rejected by tests or lint rules.
- [ ] Critical primitives meet the shared accessibility/visual matrix before suite consumption.

Suggested verification:

- `pnpm lint --filter @jami-studio/ui`
- `pnpm test --filter @jami-studio/ui`
- `pnpm build --filter @jami-studio/ui`

## Workstream 5: Always-Live Workbench Overlay

Goal: Build the real-page workbench overlay for live token editing, save/register flows, and suite/page navigation.

Depends on:

- [ ] Workstream 2 token contract.
- [ ] Workstream 3 registry metadata.
- [ ] Workstream 4 primitives.

Enables:

- [ ] Human authoring of themes, presets, pages, and suite packages.
- [ ] Jami.Studio showcase/demo surface.

Repo guidance:

- Controls stay in the overlay. The app/page remains the live subject.

Primary areas:

- `apps/workbench`
- `packages/workbench`
- `docs/architecture/workbench-overlay.md`

Implementation tasks:

- [ ] Build compact workbench status bar with target, theme/preset name, dirty state, Save, Duplicate, Restore, Register, Export, and Close.
- [ ] Build collapsible docked panels for Theme, Color, Typography, Layout, Surfaces, Components, Charts, Motion, Assets, and Registry.
- [ ] Preserve navigation while the overlay is active.
- [ ] Preserve draft state across close/reopen.
- [ ] Add explicit save, discard, duplicate, rename, restore-to-factory, register, and export flows.
- [ ] Add inspector focus if it can be done without destabilizing the first overlay.
- [ ] Gate workbench expansion on an early vertical slice: one token family, one primitive, one registry item, one CLI temp install, one renderer payload, one harness-compatible action/error fixture, and one screenshot/accessibility check.
- [ ] Add workbench visual/a11y fixtures across light, dark, factory theme, and suite-theme states.

Exit criteria:

- [ ] Token changes update the real page immediately.
- [ ] Save persists; close hides overlay without losing the draft; restore returns to factory.
- [ ] No configuration controls are scattered across product pages.
- [ ] Workbench controls do not outpace the proven registry -> CLI -> renderer -> harness compatibility loop.

Suggested verification:

- `pnpm test --filter @jami-studio/workbench`
- Browser smoke once the app exists.

## Workstream 6: Runtime Renderer And Agent UI Payload Contract

Goal: Implement the resident allowlisted renderer for structured UI payloads.

Depends on:

- [ ] Workstream 3 registry manifest shape.
- [ ] Workstream 4 resident components.

Enables:

- [ ] Harness and suite apps can render agent-emitted UI safely.

Repo guidance:

- Payloads are data, not code. Unknown names and invalid props degrade gracefully.

Primary areas:

- `packages/renderer`
- `docs/architecture/runtime-renderer.md`
- `docs/architecture/foundation-alignment.md`

Implementation tasks:

- [~] Define payload schema for component, props, children, action refs, and vocabulary generation.
- [~] Align payload, action ref, artifact view, theme ref, and suite ref contracts with `jami-harness` without importing harness runtime ownership into this repo.
- [~] Add per-component prop validation. The resident render core validates payload shape,
  reference id patterns, namespace, and the allowlist, and sanitizes props; per-component
  prop schemas remain pending.
- [x] Add fallback rendering for unknown components and invalid props. The resident renderer
  degrades unknown components to `unsupported` and unsafe/malformed payloads to `invalid` with
  renderer-owned fallback copy.
- [x] Add no-HTML/no-code injection guards (HTML strings, `javascript:` URLs, event-handler props, `dangerouslySetInnerHTML`, serialized React-element markers, package imports, inline secrets, and foreign component namespaces) enforced by `pnpm contracts:check` and by the resident renderer, which share one `safe-payload.mjs` guard.
- [ ] Add handshake/version rules for vocabulary generation.
- [x] Add unsafe payload fixtures for arbitrary React, HTML, scripts, package imports, prop injection, unknown component names, invalid props, malformed harness reference ids, and unsupported renderer states.
- [~] Add denied-action fixtures that display the harness-owned policy decision without carrying executable UI state, plus a non-executable `pending_approval` action-display fixture.

Exit criteria:

- [x] Valid payloads render resident components (resident render core in `packages/renderer/src`).
- [x] Invalid payloads never crash the renderer or execute code; they fail closed to inert
  display-only fallback states, proven by `node --test` fixture smoke tests.
- [x] Harness-facing fixtures prove the renderer can consume typed references while leaving policy/tool execution to the harness.
- [x] Renderer compatibility fixtures pass against the shared harness contract set.

Suggested verification:

- `pnpm contracts:check`
- `pnpm test --filter @jami-studio/renderer`

## Workstream 7: CLI Install And Config Flow

Goal: Provide the installable path for registry users and agents.

Depends on:

- [ ] Workstream 3 registry output.
- [ ] Workstream 2 token output.

Enables:

- [ ] Install primitives, pages, and full suites from the command line.

Repo guidance:

- CLI config writes should be explicit and inspectable.

Primary areas:

- `packages/cli`
- `docs/operations/registry-install.md`

Implementation tasks:

- [ ] Add CLI commands for init, add item, add suite, apply theme, list, inspect, doctor, update, remove, migrate, lock/pin, and provenance inspect.
- [ ] Add configuration prompts for app title, suite, theme, registry URL, package manager, and optional defaults.
- [ ] Add dry-run and diff behavior before writing files.
- [ ] Add rollback/restore guidance and conflict handling for locally modified installed files.
- [ ] Add install, update, remove, migrate, and provenance smoke tests in temporary projects.

Exit criteria:

- [ ] A clean project can install a sample theme, primitive, page, and suite.
- [ ] A previously installed project can inspect, update, remove, migrate, and verify provenance for installed items.
- [ ] CLI reports missing auth/tooling with exact next commands.

Suggested verification:

- `pnpm test --filter @jami-studio/cli`
- `pnpm build --filter @jami-studio/cli`

## Workstream 8: Suite Packs And Showcase App

Goal: Recompose the reference corpus into four polished installable suite lanes.

Depends on:

- [ ] Workstream 2 token contract.
- [ ] Workstream 3 registry contract.
- [ ] Workstream 4 UI vocabulary.
- [ ] Workstream 5 workbench overlay.
- [ ] Workstream 7 CLI install.

Enables:

- [ ] Jami.Studio public demo/showcase and full-suite install offering.

Repo guidance:

- Suite packs are serious installable app surfaces, not thin demos.

Primary areas:

- `registry/suites/solo`
- `registry/suites/business-ops`
- `registry/suites/mixed-media`
- `registry/suites/research-writing`
- `apps/workbench`

Implementation tasks:

- [ ] Build `solo` suite for calendar, forms, docs, agent, tasks, simple CRM/content/admin workflows.
- [ ] Build `business-ops` suite for staff, scheduling, forms, training, compliance, and operational dashboards.
- [ ] Build `mixed-media` suite for assets, generation, editing, pipelines, review, publishing, and media libraries.
- [ ] Build `research-writing` suite for sources, notes, citations, briefs, documents, outlines, and knowledge workflows.
- [ ] Add suite install metadata and page/block/component dependency graphs.
- [ ] Add showcase routing for the `solo` suite through the workbench/demo app.
- [ ] Add suite-level accessibility, responsive, long-content, empty/error state, and visual smoke fixtures.
- [ ] Add source/license provenance for any recomposed reference corpus material before redistribution.

Exit criteria:

- [ ] Each suite installs as a coherent full app shell.
- [ ] Each suite also exposes pages, blocks, components, and primitives independently.
- [ ] Each suite can be installed, updated, inspected for provenance, and visually/a11y smoked in a temp app.

Suggested verification:

- CLI suite install smoke per suite.
- Browser smoke per suite shell.

## Workstream 9: Verification, Release, And Registry Publishing

Goal: Make the repo releaseable, publishable, and safe for agent-driven continuation.

Depends on:

- [ ] Workstreams 1-8.

Enables:

- [ ] Ongoing registry development and public distribution.

Repo guidance:

- Publish only after local checks and install smokes prove the registry path.

Primary areas:

- `scripts/`
- `.changes/`
- `docs/operations/`
- CI config once introduced

Implementation tasks:

- [~] Add `pnpm verify` covering lint, typecheck, tests, build, registry validation, and docs checks.
- [~] Add `pnpm verify` coverage for token schema fixtures, registry provenance, renderer unsafe payloads, CLI lifecycle smokes, and accessibility/visual checks once those surfaces exist.
- [ ] Add release/changelog flow.
- [ ] Add registry publishing runbook.
- [ ] Add package publishing runbook after npm auth is confirmed.
- [ ] Add source/license audit, SBOM policy, registry item hashes, package provenance, and attestation guidance for lifted third-party source before redistribution.

Exit criteria:

- [ ] Full verification passes.
- [ ] Registry publish path is documented and smoke-tested.
- [ ] Changelog fragments and release notes are generated from the same source.
- [ ] Public registry/package claims map to source, license, generated output, and verification evidence.

Suggested verification:

- `pnpm verify`
- Registry install smoke in a clean temporary project.

## Final Verification And Closeout

- Path-lock and source-lock evidence for sibling repos, DTCG, shadcn, Tailwind, component substrates,
  package publishing, static registry hosting, and lifted source.
- Source-lock records satisfy the root current-source record for shadcn, Tailwind, DTCG, AG-UI, Agent-Native reference
  material, package publishing, static registry hosting, OWASP/NIST renderer guidance, and release
  attestation tooling before those implementation lanes depend on them.
- Shared harness/UI compatibility fixtures pass.
- Token schema, alias, deprecation, invalid reference, contrast, and generated-output fixtures pass.
- Renderer unsafe-payload and denied-action fixtures pass.
- CLI install/update/remove/migrate/provenance smokes pass in temporary projects.
- Accessibility and visual checks pass for primitives, workbench, renderer states, and suites once those
  surfaces exist.
- `pnpm docs:check`
- `pnpm contracts:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify`
- `git diff --check`
- Confirm `.env` and provider secrets remain untracked.
- Confirm account status docs match current CLI evidence.
- Confirm active roadmap, architecture docs, operations docs, and changelog fragments are current.
- Stage only intentional changes.
- Commit with a conventional subject and body.
- Push to `origin/main` once the repo has a remote.

## Acceptance Criteria

- The repo has project-specific operating docs, active roadmap, architecture docs, operations docs, and changelog flow.
- Token source model generates all runtime outputs.
- Registry items validate against shadcn and Jami metadata contracts.
- CLI can install primitives, pages, themes, and suites.
- Workbench overlay edits the live page, saves explicitly, restores factory state, and registers packages.
- Runtime renderer validates structured payloads and degrades safely.
- Four suite lanes install and expose their lower-level parts.
- Source/license and secret-handling rules are documented and enforced by checks.
- Shared harness/UI seams are backed by machine-readable compatibility fixtures, including unsupported,
  invalid, and denied states.
- CLI supports ongoing ownership: install, update, remove, migrate, inspect provenance, and recover from
  conflicts.
- Accessibility, visual quality, token determinism, source/license provenance, registry hashes, and
  release evidence are part of public readiness, not optional polish.

## Implementation Order

1. Finish Workstream 1 repo foundation, path-lock, and docs alignment.
2. Refresh source-lock evidence for drift-prone standards, packages, publishing, and lifted source.
3. Build Workstream 2 token contract with schema-version, migration, reference, contrast, and output fixtures.
4. Build Workstream 3 registry contract with provenance and lifecycle metadata.
5. Build the early vertical slice across token, registry item, primitive, CLI temp install, renderer payload,
   harness action/error fixture, and evidence.
6. Build Workstream 4 primitive/component vocabulary with accessibility, visual, state, and provenance gates.
7. Build Workstream 6 runtime renderer with safe-payload, denied-action, unsupported-state, and harness
   compatibility fixtures.
8. Build Workstream 5 always-live workbench overlay after the vertical slice proves the install/render loop.
9. Build Workstream 7 full CLI lifecycle: install, update, remove, migrate, doctor, pin/lock, conflict handling,
   and provenance inspection.
10. Build Workstream 8 suite packs and showcase app with install/update/a11y/visual/provenance smokes.
11. Build Workstream 9 verification/release/publishing system with SBOM, registry hashes, provenance, and
    attestation policy.

## Expansion Track

- Add Base UI-compatible primitive family after Radix-first items stabilize.
- Add private/authenticated registry lanes for org-specific packs.
- Add Figma/token sync once the source token contract is stable.
- Add hosted registry analytics only after privacy, consent, and OSS expectations are settled.

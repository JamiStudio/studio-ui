# Studio UI Production Shape Implementation Plan

Date: 2026-06-07
Status: Active end-to-end implementation; local foundation only
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
- Current checkout has docs, research, package/source-control scaffold, repo-readiness guidance,
  and first real product foundations under `packages/tokens`, `packages/registry`,
  `packages/renderer`, `packages/cli`, and `apps/workbench`. Full product acceptance
  remains open where the checklist still shows unchecked or partial items.
- 2026-06-12 path-lock evidence confirms `studio-ui` and `jami-harness` are separate registry-root Git
  worktrees with canonical `studio-jami/*` remotes; package metadata, generated evidence, and current
  status docs must preserve that identity.
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
- 2026-06-12 Phase 2 / Group A pass 1 added a Studio UI shared seam coverage
  matrix at `packages/renderer/fixtures/shared-seams/phase-2-shared-seam-coverage.json`.
  `pnpm contracts:check` now requires every root-roadmap seam family and case for
  `runEvent`, `uiPayload`, `artifactView`, `actionRef`, `themeRef`, `suiteRef`,
  `evidencePacket`, `memoryRecord`, `contextPack`, and `capabilityManifest`,
  checks referenced renderer/presentation fixtures for status drift, rejects unsafe
  sample refs, and verifies generated registry metadata points at the matrix. This
  is mirrored consumer-side fixture coverage only; it does not claim hosted
  registry, package release, harness runtime execution, or capability support.
- 2026-06-09 Stream 2 pass 4 added deterministic contract artifact generation for token CSS,
  Tailwind `@theme`, TypeScript token-name exports, shadcn `cssVars`, and local shadcn-shaped
  registry output under `packages/*/generated`. `pnpm contracts:check` now drift-checks those
  artifacts and enforces real SHA-256 source hashes on registry source items.
- 2026-06-12 Group B / Studio UI pass 1 added `jami-token-provenance.json` as a generated
  token-output provenance manifest. The `jami-theme` registry item now embeds it alongside
  generated token outputs, and `pnpm contracts:check` fails if the manifest omits source/output
  hashes, drifts from embedded registry file hashes, or claims hosted/package publication.
  This is local provenance hardening only; hosted registry smoke and public package publish
  remain open.
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
- 2026-06-09 Stream 5 pass 1 made the registry install path real and added the
  `@jami-studio/cli` lifecycle surface. A `jami-theme` registry item now ships the
  generated token outputs as install content; the contract generator embeds real
  file `content` plus a `sha256` hash for any file whose source resolves on disk and
  records any future source-pending files as descriptors without fabricating source.
  Four suite foundation items (`solo-suite`,
  `business-ops-suite`, `mixed-media-suite`, `research-writing-suite`) are install-graph
  descriptors with generated suite manifests and pending per-lane surfaces. The
  dependency-free CLI implements `init`, `list`, `inspect`, `add`, `remove`, `update`,
  `migrate`, `pin`/`unpin`, `lock`, `doctor`, and `provenance` over an inspectable
  `studio-ui.config.json`/`studio-ui.lock.json`, with hash-based, non-destructive
  conflict handling and rollback guidance. Remote registry fetch resolves to an explicit
  unsupported state. 17 deterministic temp-project smoke tests
  (`packages/cli/test/cli.test.mjs`) run against the real generated registry and are part
  of `pnpm verify`. No browser, workbench app, or suite app shell exists yet; suite
  page/block/component vocabulary is surfaced as planned, not installed, and no
  browser/accessibility evidence is claimed.
- 2026-06-09 Stream 5 pass 3 added the first browser-renderable surface, the
  dependency-free `apps/workbench` static showcase
  (`docs/architecture/workbench-showcase.md`). It consumes the generated token theme,
  the generated registry items and suite descriptors, the resident renderer, and the
  workbench presentation seam — no duplicated data, remote fetch, package-manager
  install, provider runtime, or harness execution. It renders the `solo` lane as a live
  route over its generated manifest and the other three lanes as honest descriptor-only
  states with pending surfaces labelled, serializes the resident renderer output
  (display-only action refs, fail-closed invalid payloads) and the presentation seam's
  operational-status panels into inert, escaped HTML, gates redacted memory content, and
  drives `factory`/`light`/`dark` theme states from the generated semantic tokens. A
  `node --test` gate (`apps/workbench/test/workbench.test.mjs`, wired into `pnpm verify`)
  proves real-data consumption, inertness, honest installed-vs-pending states, accessible
  structure, responsive/reduced-motion affordances, long-content wrapping, and computed
  WCAG contrast. A separate dependency-free headless-Edge/Chrome smoke
  (`apps/workbench/smoke/a11y-visual-smoke.mjs`) captures per-theme, focus, and
  narrow-viewport screenshots plus a structural a11y + contrast report under
  `apps/workbench/output/`. This is not a full suite app shell, the per-lane suite
  vocabulary (pending Workstream 4), an always-live editing overlay, a runtime React
  renderer, or any harness runtime.
- 2026-06-09 Stream 6 pass 1 added release/publishing/supply-chain readiness over the
  accepted Stream 5 surfaces without expanding product scope. A root MIT `LICENSE`
  and root/package `license` fields now back the existing item provenance claims
  (every item is `source: authored`, `copiedSource: false`). A read-only static
  publish dry-run (`scripts/release/publish-dry-run.mjs`, `pnpm registry:publish:check`,
  wired into `pnpm verify`) re-verifies every embedded registry content hash, scans the
  served bundle for secret-shaped content, classifies installable vs source-pending
  items from real generated content, and lists the human/account actions it cannot
  perform; the then-current status was `ready-to-stage`, with all generated items
  installable, 0 source-pending, secret-clean, and no copied source. Four operations docs were added —
  `registry-publishing.md` (runbook + readiness),
  `release-and-supply-chain.md` (release flow, SBOM, source/license provenance,
  registry hashes, package provenance, attestation policy), `release-notes.md`
  (foundation notes compiled from `.changes/` fragments with an explicit Not-Yet-Claimed
  section), and `public-claims-evidence.md` (claim -> reproducible-evidence register).
  Verification gates were strengthened, not weakened: nothing is published, no hosted
  registry or npm publish is claimed, package-scope/trusted-publish setup and the
  static host remain pending human actions, and the workbench a11y/visual smoke was re-run (14/14 structural a11y, 4/4
  contrast, 5/5 screenshots on Microsoft Edge).
- 2026-06-09 fresh Studio UI audit confirmed the root crossflow Stream 1-6 foundation
  claims are proven for the surfaces that exist: `pnpm verify`, `pnpm docs:check`,
  `pnpm contracts:check`, `pnpm registry:publish:check`, and
  `pnpm --filter @jami-studio/workbench smoke` all exit 0; `.env` remains ignored.
  This does not close the full roadmap acceptance criteria. Open product gaps remain:
  full resident-vocabulary Radix/React `packages/ui` implementations, hosted/persisted workbench
  editing and backend registration, full suite app shells/full React page-block implementations,
  hosted registry URL install smoke, automated release-note generation, SBOM/attestation
  execution at publish time, and npm/static-host publish actions.
- 2026-06-09 Workstream 4 pass 1 added a real but narrow `packages/ui` vocabulary
  foundation: authored dependency-light metadata and tokenized CSS for `button`, `panel`,
  `text-field`, `data-list`, `agent-panel`, `docs-source-panel`, and `media-grid`;
  registry items with authored MIT provenance and generated install content/hashes; a
  renderer allowlist expansion for those resident names; and `packages/ui/test/ui.test.mjs`
  coverage for importable inventory, token references, source provenance, state/a11y
  metadata, and hardcoded component color rejection. This still does not claim full
  Radix wrappers, React components, Storybook, visual regression, calendar/source-board
  shells, or full suite app shells.
- 2026-06-09 Workstream 8 pass 1 made suite packs more concrete without claiming
  full app completion. Authored source descriptors now live under
  `registry/suites/<lane>/suite-shell.json` for all four lanes and generate into
  `packages/registry/generated/suites/*.suite.json` with app-shell navigation,
  route maps, pages, blocks, resident component parts, install graph metadata,
  and long-content/empty/error state fixtures. The workbench showcase renders
  every lane from those generated manifests, and CLI temp-project smoke coverage
  installs every suite. Full React suite applications, standalone page/block
  registry items, and harness runtime behavior remain open.
- 2026-06-09 Workstream 8 pass 2 derived standalone page and block registry
  items from the authored suite shell descriptors for all four lanes. The
  generated registry exposed publishable items for the original token,
  resident vocabulary, and suite roots plus 8 page items and 18 block items with
  generated install manifests, authored MIT provenance, dependency graphs, and
  content hashes. Suite install graphs include those lower-level parts
  independently, `packages/cli/test/cli.test.mjs` proves standalone page/block
  install and provenance in temp projects, and `registry:publish:check` now
  recurses through nested generated suite artifacts. Full React suite/page/block
  implementations remain open; no hosted registry or harness runtime is claimed.
- 2026-06-09 Workstream 5 always-live overlay pass 1 made the static workbench
  materially interactive without claiming hosted persistence or backend package
  registration. `apps/workbench` now renders a compact status bar with target,
  theme/preset, dirty/storage state, Save, Duplicate, Restore, Register, Export,
  and Close; docked panels for Theme, Color, Typography, Layout, Surfaces,
  Components, Charts, Motion, Assets, and Registry; immediate CSS-variable
  updates from generated token data; localStorage-backed draft state across
  close/reopen; and deterministic local register/export artifacts marked
  `backendPersistence: false`. `apps/workbench/src/workbench-state.mjs` owns the
  pure state transitions and tests cover edit/save/duplicate/restore/register/
  export/close/reopen. Full React/Radix component implementations, hosted
  persisted editing, backend registry/package registration, independent page and
  block registry items, and full suite app shells remain open.
- 2026-06-09 Workstream 5 branding/template option pass 1 added three authored
  selectable default-kit directions (`studio-console`, `editorial-studio`, and
  `command-grid`) through accepted Studio UI seams: `registry/branding/`
  descriptors, generated registry theme items with embedded content hashes,
  contract validation that keeps the logo seed material exploratory and
  `canonicalBrand: false`, CLI temp-project install/provenance coverage, and a
  workbench option gallery plus overlay selection controls. These options express
  token deltas and suite-shell presentation choices; they do not make any final
  brand canon claim or redistribute logo source.
- 2026-06-09 post-audit implementation pass 1 promoted the resident vocabulary
  metadata into enforced source-owned schemas. `packages/ui` now exports
  per-component prop schemas, a `2026-06-09.vocabulary-handshake`, and
  descriptor-only React-style primitive metadata; `packages/renderer` imports
  those schemas so stale handshakes, unsupported props, wrong prop types, and
  invalid enum values fail closed to `invalid` while unsupported component names
  still degrade to `unsupported`. The contract fixture corpus adds negative
  fixtures for bad props, bad prop types, and stale vocabulary handshakes, and
  the workbench displays the handshake/prop-schema evidence from `packages/ui`.
  This still does not claim Radix wrappers, rendered React primitives, hosted
  registry, hosted persistence, or full suite React applications.
- 2026-06-09 post-audit confirmation pass 2 found the prop-schema enforcement
  path sound and added the missing renderer compatibility fixture for invalid
  enum values. The fixture corpus now separately proves stale handshakes,
  unsupported props, wrong prop types, invalid enum values, and unsupported
  component names keep their intended `invalid` or `unsupported` renderer
  states, and the workbench evidence test confirms the invalid-enum reason is
  visible.
- 2026-06-09 post-audit implementation pass 3 moved the resident vocabulary past
  descriptor-only metadata by adding `packages/ui/src/primitive-components.mjs`.
  It exports dependency-free, framework-neutral component factories for the seven
  resident primitives/components, a JSON-inert `renderPrimitiveSpec`, and
  `createJamiPrimitiveComponents(createElement)` for React-style adapter use
  without importing React or Radix. Generated resident UI registry items now
  embed that source with SHA-256 hashes, `validate-contracts.mjs` checks the
  embedded factory file, and the workbench vocabulary evidence shows the
  factory status/source. This still does not claim Radix wrappers, a runtime
  React renderer, hosted registry, hosted persistence, or full suite React
  applications.
- 2026-06-09 suite implementation evidence pass 1 made the four suite lanes
  concrete beyond descriptors without claiming hosted/runtime completion. The
  contract generator now derives four app implementation items plus app/page/block
  `*.implementation.json` manifests from `registry/suites/<lane>/suite-shell.json`
  and `packages/ui/src/primitive-components.mjs`. Every block implementation
  renders its ready and declared state examples through `renderPrimitiveSpec`,
  records tokenized `jami-*` classes, and keeps runtime React, hosted runtime,
  harness execution, executable actions, and Radix wrapper claims false. Generated
  suite manifests point at those implementation files, the CLI installs them in
  temp projects, the workbench surfaces the evidence, and
  `registry:publish:check` now reports 45 publishable items and 106 served files.
  Full hosted React suite runtime, Radix wrappers, hosted registry, hosted
  persistence/backend registration, final brand canon, npm/static-host publish,
  and harness runtime execution remain open.
- 2026-06-09 Workstream 9 release-artifacts pass 1 added dependency-light local
  release artifact generation and checks without claiming any publish action. The
  new `scripts/release/generate-release-artifacts.mjs` writes/checks
  `docs/generated/sbom.cdx.json` (CycloneDX 1.7 over root/package/app manifests,
  `pnpm-lock.yaml`, the Node engine declaration, and the generated registry bundle
  hash manifest) and `docs/generated/release-notes.md` (deterministic `.changes`
  rollup with legacy unclassified fragments preserved). `pnpm verify` now includes
  `pnpm release:artifacts:check`; targeted `pnpm sbom:check` and
  `pnpm release:notes:check` are available. This still does not attach a release
  SBOM, execute attestations, publish npm packages, publish the static registry,
  claim a hosted registry URL, or claim hosted persistence/backend registration.
- 2026-06-09 Workstream 9 release-artifacts audit pass 2 corrected stale release-lane
  auth/count wording without broadening scope: local `npm whoami` returns
  `jamesnavinhill`, but package publishing still needs `@jami-studio` scope
  confirmation and a trusted CI provenance workflow; generated release-note source
  fragments now avoid obsolete registry item/file counts, while current counts stay
  owned by `pnpm registry:publish:check`, `docs/operations/registry-publishing.md`,
  and `docs/operations/public-claims-evidence.md`.
- 2026-06-09 Radix wrapper readiness pass 1 added a source-locked, machine-readable
  readiness contract for future Radix/React wrappers under `packages/ui`. Official
  Radix and shadcn registry sources are recorded in `docs/operations/source-lock-records.md`;
  every resident vocabulary item now has a `do-not-claim` wrapper record until React/Radix
  dependencies, wrapper source files, prop-schema parity, tokenized styles, browser
  accessibility/visual smoke, registry install content, and renderer non-execution
  evidence exist. This does not implement Radix wrappers, add React/Radix packages,
  change generated registry output, enable hosted persistence/backend registration,
  or weaken the data-only resident renderer.
- 2026-06-09 Radix/React wrapper implementation pass 1 moved readiness metadata into
  a real but scoped wrapper slice for `button`, `panel`, and `text-field`. `@jami-studio/ui`
  now declares `@radix-ui/react-slot@1.2.5`, `@radix-ui/react-label@2.1.9`, a React
  `>=19 <20` peer, and React/React DOM `19.2.7` dev dependencies; authored wrapper
  source and evidence metadata; UI server-render tests; generated registry output that
  embeds wrapper source and Radix dependencies only for those three items; workbench
  server-rendered wrapper evidence; and an invalid renderer fixture rejecting wrapper
  package imports. This does not implement wrappers for `data-list`, `agent-panel`,
  `docs-source-panel`, or `media-grid`, enable a runtime React renderer, claim full
  suite React apps, claim hosted registry URL smoke, publish npm/static registry
  artifacts, add backend persistence/registration, execute attestations, finalize
  brand canon, or weaken the data-only resident renderer.
- 2026-06-12 Group C / Studio UI pass 1 expanded the local Radix/React wrapper
  slice across the full current resident vocabulary: `button`, `panel`,
  `text-field`, `data-list`, `agent-panel`, `docs-source-panel`, and
  `media-grid`. Generated resident UI registry items now embed the wrapper
  source for all seven items, with Radix package dependencies declared only for
  wrappers that actually use Radix Slot or Label. The workbench overlay added
  local discard, rename, import, inspector-focus, offline/online state, and
  conflict display flows. The CLI added `diff [name]` over the existing
  hash-based planner for install/update/file-drift inspection. This remains
  local/package source readiness only: no runtime React renderer, hosted
  persistence/backend registration, hosted registry URL smoke, package publish,
  mounted suite React apps, or harness runtime execution is claimed.

- 2026-06-12 reorientation: this roadmap is now aligned to the registry-root
  end-to-end completion roadmap at
  `C:\Users\james\dev\orgs\oss\registry\docs\roadmaps\2026-06-12-end-to-end-completion-roadmap.md`.
  The current Group C head `643d9a0` is accepted as a local foundation checkpoint only. Studio UI is
  not complete until tokens, registry, primitives, Radix/React wrappers, renderer,
  workbench, CLI, suite apps, hosted registry, hosted showcase, package publishing,
  release artifacts, attestations, public claims, and cross-repo harness seams all have
  executable evidence. Descriptor-only manifests, local dry-runs, and fail-closed
  unsupported routes are not final completion.
- 2026-06-12 Group D pass 1 added local mounted React suite route source at
  `packages/ui/src/suites.mjs`, generated app/page/block manifests that point at
  that source, preview route files under `apps/workbench/dist/suites/<lane>/`,
  and `pnpm hosted:routes:check` over local registry/docs/workbench/showcase/
  suite artifacts. This materially advances mounted suite and hosted-route
  readiness, but still does not claim Cloudflare/DNS deployment, live hosted URL
  smoke, hosted persistence, npm publication, provenance attestations, or final
  public clean-install acceptance.

## Complete Production Shape And Absolute Exit Criteria

The complete Studio UI product is the public, installable, hosted shadcn-compatible
registry and UI foundation for Jami.Studio. It must work from public packages and a hosted
registry, not only from a source checkout. The following routes are the definition of the
end state.

### Tokens

- [ ] DTCG-compatible token source supports aliases, composites, modes, theme families,
  migration metadata, invalid references, deprecations, and deterministic source hashing.
- [ ] Generated outputs include CSS variables, Tailwind theme variables, TypeScript exports,
  shadcn `cssVars`, docs, workbench control schemas, registry content, and output hashes.
- [ ] Checks cover contrast, invalid references, missing semantics, stale migrations,
  deprecated aliases, broken composites, mode overrides, and generated-output drift.
- [ ] Visual evidence covers factory, light, dark, suite themes, long content, disabled,
  focus, loading, empty, error, responsive, and reduced-motion states.

### Registry

- [ ] shadcn-compatible registry metadata covers names, lifecycle, compatibility,
  dependencies, provenance, content hashes, source files, examples, docs refs, screenshots,
  harness refs, migrations, deprecations, and replacement guidance.
- [ ] Hosted registry bundle has URL layout, cache policy, revision naming, integrity
  manifest, secret scan, and hosted install smoke.
- [ ] Registry items cover themes, primitives, wrapper source, pages, blocks, suites,
  workbench artifacts, docs panels, and harness compatibility fixtures.
- [ ] Registry publish checks validate generated content, package provenance, no copied
  source unless licensed, no secrets, and deterministic file hashes.

### Primitives, Wrappers, And Renderer

- [ ] Radix/React wrappers exist for `button`, `panel`, `text-field`, `data-list`,
  `agent-panel`, `docs-source-panel`, `media-grid`, and every additional suite-required
  primitive.
- [ ] Every wrapper has prop schema, tokenized styles, accessibility metadata,
  keyboard/focus behavior, loading, disabled, invalid, empty, error, long-content,
  responsive, and reduced-motion states.
- [ ] Browser visual and accessibility evidence exists for every primitive and wrapper.
- [ ] Runtime React suite/app renderer is implemented for installed UI and suite surfaces;
  data-only resident rendering remains the safe harness boundary.
- [ ] Safe renderer fixtures cover every shared harness ref and every valid, invalid,
  unsupported, denied, pending, stale, redacted, missing-source, expired, replayed, and
  error state.
- [ ] UI rendering never executes harness-owned action, policy, provider, memory, or tool
  side effects.

### Workbench

- [ ] Workbench supports save, discard, rename, duplicate, restore, register, export,
  import, inspector focus, persisted backend registration, package
  registration, offline/online state, conflict recovery, and hosted state.
- [ ] Hosted workbench/showcase deploys and passes browser, accessibility, visual,
  responsive, keyboard, focus, reduced-motion, long-content, empty, error, disabled,
  loading, denied, and redacted-state evidence.
- [ ] Workbench evidence panels display registry hashes, release artifacts, SBOM, hosted
  status, public claims, and harness compatibility fixtures.
- [ ] Workbench Save, Duplicate, Restore, Register, Export, Close, reopen, persisted draft,
  and backend registration routes have tests and browser evidence.

### CLI

- [ ] CLI supports local and hosted registry add, update, remove, migrate, doctor, pin,
  lock, diff, dry-run, provenance, package manager detection, app title, suite, theme,
  registry URL, defaults, rollback, conflict recovery, and remote fetch.
- [ ] Clean temp-project smokes cover theme, primitive, wrapper, page, block, suite, hosted
  URL, update, remove, migrate, provenance, and conflict routes.
- [ ] CLI reports missing tooling and account setup with exact next commands and does not
  silently succeed on unsupported remote or hosted routes.

### Suites

- [~] `solo` is a mounted React suite for calendar, forms, docs, agent, tasks, simple
  CRM/content/admin workflows.
- [~] `business-ops` is a mounted React suite for staff, scheduling, forms, training,
  compliance, and dashboards.
- [~] `mixed-media` is a mounted React suite for assets, generation, editing, pipelines,
  review, publishing, and media libraries.
- [~] `research-writing` is a mounted React suite for sources, notes, citations, briefs,
  documents, outlines, and knowledge workflows.
- [~] Every suite includes app shell, routes, pages, blocks, primitive dependencies, fixture
  data, empty/loading/error/denied states, responsive/mobile layout, focus/keyboard,
  reduced motion, long content, visual smoke, accessibility smoke, CLI install smoke,
  hosted showcase route, source/license provenance, and harness ref compatibility.
  (Local mounted React app/page/block route artifacts and hosted-route preview
  manifest now exist; live hosted route smoke, hosted persistence, and final
  public install acceptance remain open.)

### Hosted, Package, Release, And Public Trust

- [ ] Public Studio UI packages install from the accepted public package channel in clean
  external projects.
- [ ] `private: true` is removed only after package contents, provenance, source locks, and
  install smokes pass.
- [ ] Static registry deploy and hosted URL install smoke pass.
- [ ] Package contents dry-run, trusted publishing or accepted provenance workflow, SBOM,
  signing/attestation, release notes, changelog, public claims evidence, and post-publish
  registry/package smoke pass.
- [ ] Rollback, deprecation, unpublish, support, security, and incident runbooks are present
  and match implemented routes.

### Cross-Repo Harness Seams

- [ ] Shared fixtures cover `runEvent`, `uiPayload`, `artifactView`, `actionRef`,
  `themeRef`, `suiteRef`, `evidencePacket`, `memoryRecord`, `contextPack`, and
  `capabilityManifest` in both repos.
- [ ] Studio UI renders harness-originated artifacts, traces, memory/context, evidence
  packets, and action refs without executing harness-owned side effects.
- [ ] Denied, invalid, unsupported, stale, redacted, missing-source, expired, and replayed
  states fail closed.
- [ ] Policy, tool execution, provider execution, memory decisions, and artifact promotion
  remain harness-owned.

## Locked Decisions

- The registry uses one public `@jami-studio` namespace. Suite identity lives in item names and metadata.
- The first primitive base is Radix-first shadcn. Base UI remains a later compatible family, not the first default.
- Token source is DTCG-compatible JSON, generated into CSS variables, Tailwind theme variables, TypeScript types, shadcn `cssVars`, docs, and workbench control schemas.
- Theme editing is always live. There is no staged apply flow and no preview/live toggle.
- The theme workbench is an overlay over the real app/page: compact status bar, collapsible docked panels, inspector focus, retained navigation, close/reopen behavior, and explicit Save.
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
- `packages/cli` owns install/config flows for app title, selected suite, theme, registry URL, and defaults.
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
- `suiteRef` for suite install graphs and harness capabilities.

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
  unsupported states, denial behavior, trace/evidence mapping, auth expectations, cancellation,
  streaming behavior, and verification evidence.
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
- [x] Generate CSS variables, Tailwind `@theme` variables, TypeScript types, shadcn `cssVars` payloads, and token-output provenance manifest.
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
- [~] Add item types for primitives, components, blocks, pages, themes, fonts, apps, and suites. (primitive, theme, and suite items exist; components, blocks, pages, fonts, and apps are pending.)
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

- [~] Define primitive inventory and import boundaries. (`packages/ui` now exposes the
  first source-owned resident vocabulary metadata and package exports for `button`,
  `panel`, `text-field`, `data-list`, `agent-panel`, `docs-source-panel`, and
  `media-grid`, plus React-style primitive metadata and framework-neutral component
  factories, plus a source-locked Radix wrapper readiness contract and authored
  Radix/React wrapper source for all current resident vocabulary items.)
- [~] Add tokenized primitive implementations. (Initial authored CSS uses generated
  `--jami-*` variables for the resident vocabulary, and the component factories
  emit those classes without executable action handlers while treating caller
  children as inert display data; Radix/React wrappers exist for `button`, `panel`,
  `text-field`, `data-list`, `agent-panel`, `docs-source-panel`, and
  `media-grid`, while runtime React rendering and full browser visual regression
  remain pending.)
- [~] Add composed components for agent panel, data display, forms, calendar shell, docs shell, media grid, source board, and command/action surfaces. (`agent-panel`, `data-list`,
  `text-field`, `docs-source-panel`, `media-grid`, and `button` metadata/styles/factories exist;
  calendar shell and source-board composition remain pending.)
- [~] Add Storybook-like or workbench-compatible examples once the workbench scaffold exists.
  (The workbench vocabulary section now surfaces component-factory status/source from
  `packages/ui`; dedicated primitive example stories remain pending.)
- [~] Add accessibility, interaction, and visual regression checks for critical primitives.
  (`packages/ui/test/ui.test.mjs` checks ARIA/state metadata, tokenized CSS, importable
  non-executable component factories, inert child-slot handling, and invalid-prop
  fail-closed behavior; `packages/ui/test/radix-react-wrappers.test.mjs` checks the
  resident Radix/React wrapper slice through server-rendered React evidence; browser
  visual regression for the primitives remains pending.)
- [~] Add state fixtures for keyboard, focus visibility, ARIA names/states, contrast, reduced motion, responsive layout, disabled, loading, invalid, empty, error, and long-content behavior. (The state matrix is recorded and tested in vocabulary metadata; per-component browser fixtures remain pending.)
- [x] Add per-component prop schemas for the resident vocabulary. (`packages/ui`
  exports structured prop schemas and tests for valid, unsupported, wrong-type,
  and invalid-enum props; `packages/renderer` consumes those schemas.)
- [x] Add source/license provenance review before lifted third-party source is redistributed.
  (No third-party source was lifted in this pass; every new registry item records authored
  MIT provenance and `copiedSource: false`.)

Exit criteria:

- [~] Primitive and component vocabulary is tokenized and registry-addressable. (Initial
  metadata/styles, React-style descriptor metadata, framework-neutral component
  factories, local Radix/React wrapper source, and registry items exist; runtime
  React rendering remains pending.)
- [x] Component-local hardcoded colors are rejected by tests or lint rules.
- [~] Critical primitives meet the shared accessibility/visual matrix before suite consumption.
  (Metadata, CSS guards, Radix wrapper readiness evidence, and server-rendered
  wrapper evidence exist; dedicated browser visual/a11y evidence per primitive and
  per wrapper remains pending.)

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

- [x] Build compact workbench status bar with target, theme/preset name, dirty state, Save, Duplicate, Restore, Register, Export, and Close.
- [~] Build collapsible docked panels for Theme, Color, Typography, Layout, Surfaces, Components, Charts, Motion, Assets, and Registry. (All requested panels exist in the static overlay; panels are data-backed where current token, suite, component, fixture, and registry data exists, while Charts honestly reports no chart registry item yet.)
- [x] Preserve navigation while the overlay is active. (The overlay is fixed over the generated showcase and does not replace section navigation.)
- [x] Preserve draft state across close/reopen. (`localStorage` stores the static-runtime draft and closed/open state.)
- [~] Add explicit save, discard, duplicate, rename, restore-to-factory, register, and export flows. (Save, discard, rename, duplicate, restore-to-factory, local import/register/export artifacts, offline/online state, conflict display, and close/reopen are implemented as deterministic local transitions; backend persistence/registration remain pending.)
- [x] Add inspector focus if it can be done without destabilizing the first overlay. (Implemented as a local state target in the static overlay; no backend focus persistence is claimed.)
- [x] Gate workbench expansion on an early vertical slice: one token family, one primitive, one registry item, one CLI temp install, one renderer payload, one harness-compatible action/error fixture, and one screenshot/accessibility check. (The `apps/workbench` static surface proves the token theme -> registry/suite descriptor -> resident renderer -> presentation seam loop end to end and now exposes the local always-live editing overlay over that same real page.)
- [~] Add workbench visual/a11y fixtures across light, dark, factory theme, and suite-theme states. (The showcase builds `factory`/`light`/`dark` theme states with per-theme screenshots and a structural a11y + contrast smoke; dedicated persisted suite-theme state and full visual regression remain pending.)

Exit criteria:

- [x] Token changes update the real page immediately. (Overlay controls update CSS variables on the generated workbench page as the draft changes.)
- [~] Save persists; close hides overlay without losing the draft; restore returns to factory. (Implemented for static-runtime local state through `localStorage`; hosted persistence remains unclaimed.)
- [x] No configuration controls are scattered across product pages.
- [x] Workbench controls do not outpace the proven registry -> CLI -> renderer -> harness compatibility loop. (Controls are limited to generated token, suite, component, fixture, and registry data plus explicit no-chart state.)

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
- [x] Add per-component prop validation. The resident render core validates payload shape,
  reference id patterns, namespace, allowlist, vocabulary handshake version, and
  source-owned component prop schemas before emitting output.
- [x] Add fallback rendering for unknown components and invalid props. The resident renderer
  degrades unknown components to `unsupported` and unsafe/malformed payloads to `invalid` with
  renderer-owned fallback copy.
- [x] Add no-HTML/no-code injection guards (HTML strings, `javascript:` URLs, event-handler props, `dangerouslySetInnerHTML`, serialized React-element markers, package imports, inline secrets, and foreign component namespaces) enforced by `pnpm contracts:check` and by the resident renderer, which share one `safe-payload.mjs` guard.
- [x] Add handshake/version rules for vocabulary generation. (`packages/ui` exports
  `2026-06-09.vocabulary-handshake`, and valid payload fixtures must declare it;
  stale-handshake fixtures fail closed to `invalid`.)
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

- [x] Add CLI commands for init, add item, add suite, apply theme, list, inspect, doctor, update, remove, migrate, lock/pin, and provenance inspect. (Theme/suite apply is `add <item>`; all commands implemented in `packages/cli`.)
- [~] Add configuration for app title, suite, theme, registry URL, package manager, and defaults. (Flag-driven `init` today; interactive prompts pending.)
- [~] Add dry-run and diff behavior before writing files. (`--dry-run` reports the per-file action plan; `diff [name]` reports install/update/file-drift actions without writing; per-line textual diffs remain pending.)
- [x] Add rollback/restore guidance and conflict handling for locally modified installed files.
- [x] Add install, update, remove, migrate, and provenance smoke tests in temporary projects.

Exit criteria:

- [~] A clean project can install a sample theme, primitive, page, block, and suite. (Theme and resident vocabulary items install real embedded content, including component factory source; suites install generated manifests plus standalone page/block descriptors; full React suite/page/block implementations remain pending.)
- [x] A previously installed project can inspect, update, remove, migrate, and verify provenance for installed items.
- [~] CLI reports missing tooling with exact next commands. (`doctor` reports next commands; `diff` reports local drift without writing; remote registry is an explicit unsupported state; account/auth tooling integration is pending.)

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
- [~] Add suite install metadata and page/block/component dependency graphs.
  (Authored suite shell descriptors now generate app-shell navigation, route
  maps, pages, blocks, resident component parts, install graph metadata, and
  long-content/empty/error state fixtures for all four lanes. Standalone page
  and block registry items plus generated app implementation items are generated
  from the same source descriptors and included in suite install graphs; local
  mounted React route artifacts now exist, while external hosted runtime remains
  pending.)
- [~] Add showcase routing for all four suites through the workbench/demo app.
  (The `apps/workbench` static showcase renders every lane from generated suite
  manifests, surfaces mounted React app/page/block route artifacts plus
  primitive-factory state evidence, and labels the remaining external hosted
  runtime gap.)
- [~] Add suite-level accessibility, responsive, long-content, empty/error state,
  and visual smoke fixtures. (The generated-shell showcase and smoke cover the
  static suite shell route cards, mounted React route artifacts, resident
  component parts, primitive-factory block render states, wrapping, empty/error
  state copy, responsive layout, and screenshots; live hosted per-suite visual
  regression remains pending.)
- [x] Add source/license provenance for any recomposed reference corpus material
  before redistribution. (No Builder.io or Agent-Native source was lifted; the
  suite shells are authored MIT source with `copiedSource: false`.)

Exit criteria:

- [~] Each suite installs as a coherent full app shell descriptor. (CLI temp
  smokes install generated suite shell manifests and mounted React app
  implementation manifests for all four lanes; external hosted suite runtime
  remains pending.)
- [~] Each suite also exposes pages, blocks, components, and primitives
  independently. (Generated manifests expose page/block/component metadata,
  standalone page/block registry items, install resident vocabulary dependencies,
  generated page/block implementation manifests, and local mounted React
  pages/blocks.)
- [~] Each suite can be installed, updated, inspected for provenance, and
  visually/a11y smoked in a temp app. (Install smoke exists per suite and
  standalone app/page/block item, provenance is authored MIT/no copied source, and
  workbench visual/a11y smoke covers the static generated-shell, mounted React
  route artifacts, and primitive-factory implementation showcase; live hosted
  suite visual smoke remains pending.)

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

- [~] Add `pnpm verify` covering lint, typecheck, tests, build, registry validation, and docs checks. (Runs docs, contract, artifact-drift, publish-dry-run, and package tests; lint/typecheck/build land with the product packages.)
- [~] Add `pnpm verify` coverage for token schema fixtures, registry provenance, renderer unsafe payloads, CLI lifecycle smokes, and accessibility/visual checks once those surfaces exist. (All present except browser a11y/visual, which stays a separate dependency-free smoke by design.)
- [x] Add release/changelog flow. (Release flow + curated notes live in
  `release-and-supply-chain.md` and `release-notes.md`; the checked generated
  rollup from `.changes/` fragments lives at `docs/generated/release-notes.md`
  and is enforced by `pnpm release:notes:check` / `pnpm verify`.)
- [x] Add registry publishing runbook. (`docs/operations/registry-publishing.md` + `pnpm registry:publish:check`.)
- [~] Add package publishing runbook after package-scope and trusted publish workflow are confirmed. (Policy + steps in `release-and-supply-chain.md`; local npm auth exists, but scoped access and trusted CI provenance remain pending.)
- [~] Add source/license audit, SBOM policy, registry item hashes, package provenance, and attestation guidance for lifted third-party source before redistribution. (Documented in `release-and-supply-chain.md`; local SBOM generation/check now exists at `docs/generated/sbom.cdx.json` and `pnpm sbom:check`. Release attachment, npm provenance, and attestation execution remain pending publish workflow/account setup. No third-party source is currently lifted.)

Exit criteria:

- [x] Full verification passes. (`pnpm verify` exit 0, including `registry:publish:check`.)
- [~] Registry publish path is documented and smoke-tested. (Documented + a read-only publish dry-run passes against the generated bundle; a hosted-URL install smoke is pending host provisioning.)
- [x] Changelog fragments and release notes are generated from the same source. (`docs/generated/release-notes.md` is generated from `.changes/` fragments and checked by `pnpm release:notes:check`; curated release posture remains in `docs/operations/release-notes.md`.)
- [~] Public registry/package claims map to source, license, generated output, and verification evidence. (`docs/operations/public-claims-evidence.md` maps every current claim to a reproducible command/artifact.)

Suggested verification:

- `pnpm verify`
- `pnpm release:artifacts:check`
- `pnpm sbom:check`
- `pnpm release:notes:check`
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
- `pnpm release:artifacts:check`
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

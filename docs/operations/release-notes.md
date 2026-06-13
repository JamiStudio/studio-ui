# Release Notes

Status: Public release
Last updated: 2026-06-13

These curated notes are backed by accepted `.changes/` fragments
(`docs/operations/changelog.md`) and the generated rollup at
`docs/generated/release-notes.md` (`pnpm release:notes:check`). They describe
shipped, verified public `0.1.0` behavior. Public npm packages, the
`registry.jami.studio` static registry/docs routes, and the GitHub release are
live. Hosted workbench/showcase and suite routes remain open. The "Not Yet
Claimed" section is part of the notes, not an afterthought.

## Foundation (0.1.0)

### Repo, docs, and boundary

- Project-specific operating rules, active roadmap, product shape, repository map,
  account/env lanes, readiness checklist, and changelog system are in place.
- Studio UI and Jami Harness are path-locked sibling repositories with distinct
  `@jami-studio/*` ownership; the boundary is a typed contract surface, not merged
  planning (`docs/architecture/foundation-alignment.md`).
- `registry.jami.studio` is locked as the static generated registry distribution
  endpoint; no repo-placeholder app projects are required.

### Tokens

- DTCG-compatible source token model with a warm Jami factory theme anchored on
  `#C14D84`. Deterministic generated outputs — CSS variables, Tailwind `@theme`,
  TypeScript token names, and shadcn `cssVars` — are drift-checked
  (`pnpm contracts:artifacts:check`).

### Registry

- Registry item metadata contract over one public `@jami-studio` namespace with
  lifecycle, provenance, compatibility, token-requirement, and install-file fields.
- Deterministic shadcn-shaped generated output: `registry.json`, per-item
  artifacts, and suite manifests, with embedded install `content` and `sha256`
  hashes where source resolves on disk. Source items carry validated SHA-256 source
  hashes.
- Items: `jami-theme` (installable — its files are the generated token outputs);
  three selectable brand/template option descriptors (`studio-console-brand`,
  `editorial-studio-brand`, `command-grid-brand`) that are CLI-inspectable and
  explicitly not final brand canon; seven resident vocabulary items (`button`, `panel`, `text-field`, `data-list`,
  `agent-panel`, `docs-source-panel`, `media-grid`) with authored metadata,
  framework-neutral component factories, inert child-slot handling, and tokenized
  styles embedded as real install content; all seven now embed authored
  Radix/React wrapper source as local install content, with Radix package
  dependencies only on the wrappers that actually use them; four suite install-graph
  descriptors (`solo`, `business-ops`, `mixed-media`, `research-writing`); and
  four generated app implementation items, eight standalone page items, and
  eighteen standalone block items generated from authored suite-shell source
  descriptors and framework-neutral primitive factories. Suite installs now expose
  app/page/block implementation manifests independently, with generated content hashes.

### Renderer and harness seam

- Machine-readable compatibility fixture spine for `uiPayload`, `artifactView`,
  `actionRef` (denied and pending-approval), `themeRef`, `suiteRef`, unsupported
  components, invalid payloads, and renderer error states, enforced by
  `pnpm contracts:check`.
- A dependency-free resident render core that turns a validated payload into an
  inert, JSON-serializable render tree, fails closed on unsafe/malformed payloads,
  drops forged execution capability, and shares one `safe-payload.mjs` guard with
  the contract gate so they cannot drift.
- A workbench presentation seam that renders harness refs (artifact views, evidence
  packets, run-event traces, memory records, context packs, action refs) as inert,
  display-only operational descriptors. Policy, approval, execution, redaction, and
  freshness stay harness-owned.

### CLI

- `@jami-studio/cli`: a dependency-free install/config lifecycle (`init`, `list`,
  `inspect`, `add`, `remove`, `update`, `diff`, `migrate`, `pin`/`unpin`, `lock`,
  `doctor`, `provenance`) over an inspectable `studio-ui.config.json`/`studio-ui.lock.json`,
  with hash-based non-destructive conflict handling, rollback guidance, and
  provenance verification. The hosted `https://registry.jami.studio` registry is
  supported through the documented `--registry` flag; `--registry-url` is accepted
  as an alias. Non-HTTPS remote registries fail closed.
  18 temp-project smoke tests run against the real generated registry, including
  standalone suite app/page/block implementation install and provenance.

### Workbench showcase

- `apps/workbench`: a dependency-free static browser surface over the generated
  theme, registry/suite descriptors, resident renderer, and presentation seam. It
  renders all four suite lanes as generated shell routes with primitive-factory
  implementation evidence, serializes renderer/presentation output as inert escaped
  HTML, drives `factory`/`light`/`dark` theme states from generated tokens, presents
  selectable non-canon default-kit brand/template options from generated registry items, and adds an always-live local overlay for
  token edits, brand-option selection, save/discard/rename/duplicate/restore/import,
  inspector focus, offline/online local state, local register/export artifacts, and
  close/reopen state. A `node --test` gate is wired into `pnpm verify`; a separate
  headless Edge/Chrome smoke captures per-theme/focus/responsive screenshots and a
  structural a11y + contrast report.

### Release and supply chain

- Root MIT `LICENSE` added; root and every package declare `license: "MIT"` to match
  item provenance (all items `source: authored`, `copiedSource: false`).
- `pnpm registry:publish:check` static publish dry-run added and wired into
  `pnpm verify`: it re-verifies every embedded content hash, scans served bytes for
  secret-shaped content, classifies installable vs source-pending items, and reports
  human/account actions. Current status: `ready-to-stage`, 45 publishable generated
  items, 0 source-pending, 106 served files, secret-clean, no copied third-party source.
- Registry publishing runbook, release/supply-chain policy (SBOM, provenance,
  hashes, attestation), and a public-claims evidence map added under
  `docs/operations/`.
- `pnpm release:artifacts:check` now verifies two local generated release
  readiness artifacts: `docs/generated/sbom.cdx.json` (CycloneDX 1.7, generated
  from package/app manifests, `pnpm-lock.yaml`, Node engine declaration, and the
  generated registry bundle hash manifest) and `docs/generated/release-notes.md`
  (deterministic rollup from `.changes/` fragments, with legacy unclassified
  fragments preserved rather than silently dropped). These artifacts are checked
  by `pnpm verify`.
- `pnpm release:packages:check` verifies local package manifests, npm pack
  dry-runs, clean local tarball install, and public npm metadata for all five
  `@jami-studio/*@0.1.0` packages, including tarball URL, `sha512` integrity,
  and SLSA provenance metadata.
- GitHub release `studio-jami/studio-ui@v0.1.0` has the release archive and
  checksum assets.

### Hosted Registry And Docs

- `https://registry.jami.studio/registry.json` serves the static generated
  registry with JSON content type and public cache headers.
- `pnpm hosted:live:check -- --base-url https://registry.jami.studio` fetches
  the registry and required docs routes, scans served bytes for secret-shaped
  content, and installs a theme, primitive, page, block, and all four suite roots
  through the remote CLI path. It also requires the hosted static
  workbench/showcase route and a hosted suite preview route.
- The workbench/showcase and generated suite previews are static hosted routes.
  Hosted persistence, backend package registration, hosted suite runtime, and
  harness execution are not claimed.

## Verification

`pnpm verify` passes (exit 0) on this machine. It runs `docs:check`,
`contracts:check`, `contracts:artifacts:check`, `registry:publish:check`,
`release:artifacts:check`, and the tokens / registry / renderer / cli /
workbench package tests. The workbench browser/a11y/visual smoke passed most
recently with 14/14 structural a11y, 4/4 contrast, and 5/5 screenshots on
Microsoft Edge. This pass was verified on Node 24.16.0 via
`fnm use 24.16.0` and pnpm 10.33.2.

## Not Yet Claimed

- No runtime React renderer, hosted/persisted workbench editing, backend package
  registration, and no hosted/full React suite runtime.
  Per-lane suite app/page/block implementation manifests are generated and installable,
  and local mounted React route artifacts exist; hosted runtime state is still not
  implemented.
- No final brand canon. The brand/template options are selectable registry
  descriptors for comparison only; the exploratory logo seed files remain outside
  production token, registry, and package branding canon.
- No harness runtime in this repo: agent execution, policy, tools, memory, and
  traces are owned by Jami Harness and only displayed here.
- Public generated-source compatibility with specific shadcn/Tailwind versions is
  gated on a repo-local source-lock record.

## Source

These notes trace to the fragments under `.changes/`. Keep fragments until a release
closeout explicitly consumes them (`docs/operations/changelog.md`).

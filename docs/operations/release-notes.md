# Release Notes

Status: Foundation — unreleased
Last updated: 2026-06-09

These notes are compiled from the accepted `.changes/` fragments
(`docs/operations/changelog.md`). They describe shipped, verified foundation
behavior. Nothing has been published: all packages are `private: true` at version
`0.0.0`, and no registry or npm artifact has been released. The "Not Yet Claimed"
section is part of the notes, not an afterthought.

## Foundation (0.0.0, unreleased)

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
  seven resident vocabulary items (`button`, `panel`, `text-field`, `data-list`,
  `agent-panel`, `docs-source-panel`, `media-grid`) with authored metadata and
  tokenized styles embedded as real install content; and four suite install-graph
  descriptors (`solo`, `business-ops`, `mixed-media`, `research-writing`) with
  generated manifests and explicitly pending per-lane surfaces.

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
  `inspect`, `add`, `remove`, `update`, `migrate`, `pin`/`unpin`, `lock`, `doctor`,
  `provenance`) over an inspectable `studio-ui.config.json`/`studio-ui.lock.json`,
  with hash-based non-destructive conflict handling, rollback guidance, and
  provenance verification. Remote registry fetch is an explicit unsupported state.
  15 temp-project smoke tests run against the real generated registry.

### Workbench showcase

- `apps/workbench`: a dependency-free static browser surface over the generated
  theme, registry/suite descriptors, resident renderer, and presentation seam. It
  renders the `solo` lane live and the other lanes as honest descriptor-only states,
  serializes renderer/presentation output as inert escaped HTML, and drives
  `factory`/`light`/`dark` theme states from generated tokens. A `node --test` gate
  is wired into `pnpm verify`; a separate headless Edge/Chrome smoke captures
  per-theme/focus/responsive screenshots and a structural a11y + contrast report.

### Release and supply-chain readiness (this pass)

- Root MIT `LICENSE` added; root and every package declare `license: "MIT"` to match
  item provenance (all items `source: authored`, `copiedSource: false`).
- `pnpm registry:publish:check` static publish dry-run added and wired into
  `pnpm verify`: it re-verifies every embedded content hash, scans served bytes for
  secret-shaped content, classifies installable vs source-pending items, and reports
  human/account actions. Current status: `ready-to-stage`, 12 publishable generated
  items, 0 source-pending, secret-clean, no copied third-party source.
- Registry publishing runbook, release/supply-chain policy (SBOM, provenance,
  hashes, attestation), and a public-claims evidence map added under
  `docs/operations/`.

## Verification

`pnpm verify` passes (exit 0) on this machine. It runs `docs:check`,
`contracts:check`, `contracts:artifacts:check`, `registry:publish:check`, and the
tokens / registry / renderer / cli / workbench package tests. The workbench
browser/a11y/visual smoke passed most recently with 14/14 structural a11y, 4/4
contrast, and 5/5 screenshots on Microsoft Edge. Node `>=24` is the declared
engine; runs succeed on Node 22 with a non-fatal pnpm unsupported-engine warning.

## Not Yet Claimed

- No hosted registry: `registry.jami.studio` is a declared target, not a live
  endpoint. The CLI does not fetch a remote registry, run a package manager, or
  install from a hosted URL.
- No published npm packages; npm is not authenticated and `@jami-studio` scope
  access is unconfirmed.
- No runtime React renderer, no interactive workbench editing app, and no full suite
  app shells. Per-lane suite page/block/component vocabulary is planned, not built.
- No harness runtime in this repo: agent execution, policy, tools, memory, and
  traces are owned by Jami Harness and only displayed here.
- No branding canon: current logo material is exploratory only; branding work is
  deferred until the release/shared-seam foundation is accepted.
- Public generated-source compatibility with specific shadcn/Tailwind versions is
  gated on a repo-local source-lock record.

## Source

These notes trace to the fragments under `.changes/`. Keep fragments until a release
closeout explicitly consumes them (`docs/operations/changelog.md`).

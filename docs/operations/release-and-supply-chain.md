# Release And Supply Chain

Status: Foundation policy
Last updated: 2026-06-09

## Purpose

Define the release flow and the supply-chain posture (SBOM, source/license
provenance, registry item hashes, package provenance, and attestation) that must be
satisfied before any public package or registry publish. This is the policy and the
current honest state; nothing has been published.

## Release Flow

1. Land production-meaningful work with a `.changes/` fragment
   (`docs/operations/changelog.md`).
2. Run the local verification ladder for the touched surface, ending at
   `pnpm verify` (`docs/operations/development-workflow.md`).
3. Compile release notes from the accepted `.changes/` fragments into
   `docs/operations/release-notes.md`. Release notes describe shipped, verified
   behavior and an explicit "Not Yet Claimed" section — never aspirational status.
4. Before any publish, satisfy the supply-chain gates below and the human/account
   actions in `docs/operations/registry-publishing.md`.
5. Tag and publish only after the dry-run is `ready-to-stage`, the hosting/auth
   actions are resolved, and public claims map to evidence
   (`docs/operations/public-claims-evidence.md`).

Versions are `0.0.0` across the workspace and all packages are `private: true`. No
package or registry artifact has been published.

## SBOM Policy

- **Current footprint.** The workspace has zero third-party runtime or dev
  dependencies. `pnpm-lock.yaml` records a single importer (`.`) with no resolved
  packages, and no package manifest declares `dependencies` or `devDependencies`.
  Every package and script runs on Node.js built-ins only.
- **Consequence.** The current SBOM is trivially small: the only first-party
  components are the workspace packages themselves, and the only external runtime
  dependency is the Node.js engine (`>=24` declared in `engines`; verified locally
  on `v22.x` and `v24.x`). There is no transitive dependency tree to enumerate.
- **Before first publish.** Generate a machine-readable SBOM (CycloneDX or SPDX)
  from the package graph and the lockfile, attach it to the release, and re-verify it
  carries no undeclared third-party component. Add the generation command to this doc
  when the publishing toolchain is chosen. Re-run the SBOM whenever a real dependency
  is added — a single added dependency changes the supply-chain risk class.

## Source And License Provenance

- The repo ships a root MIT `LICENSE`; the root and every package manifest declare
  `license: "MIT"`.
- Every generated registry item carries `meta.provenance`
  (`source`, `license`, `reviewedAt`, `copiedSource`). The current bundle is entirely
  `source: authored`, `license: MIT`, `copiedSource: false`.
- No third-party source has been lifted or redistributed. If/when reference-corpus
  source is recomposed, it must carry verified upstream license scope, attribution,
  source path, and current-state evidence in a source-lock record
  (`docs/operations/source-lock-records.md`) before redistribution, and the dry-run's
  `copiedSourceItems` list must be reviewed against those records.

## Registry Item Hashes

- Every installable file in the generated registry carries a `sha256:` content hash;
  every item carries a `lifecycle.sourceHash`.
- `pnpm contracts:check` enforces the source hashes against the source items.
- `pnpm registry:publish:check` re-verifies that every embedded content hash
  recomputes exactly and runs a secret-shaped-content scan over the served bytes.
- The `@jami-studio/cli` `provenance` command verifies registry content hashes
  against embedded content and on-disk installs
  (`docs/operations/registry-install.md`).

## Package Provenance And Attestation

Policy target for the first real package publish (none performed yet):

- Publish from a trusted CI runner using npm provenance (`npm publish --provenance`
  via OIDC) so each package carries a verifiable build attestation, rather than
  publishing from an unattested local machine.
- Attach the SBOM and the source/license provenance summary to the release.
- For the static registry, treat the per-file `sha256` hashes as the integrity
  attestation; document any host-level signing if the static host adds it.

These require account and CI setup that is not done:

- npm is not authenticated (`npm whoami` returns `ENEEDAUTH`).
- The `@jami-studio` package scope/access policy is unconfirmed.
- No trusted CI publish workflow exists; CI is manual `workflow_dispatch` fallback
  only (`docs/operations/development-workflow.md`).

Store any npm automation token in a host secret store, never in tracked files.

## Security And Support Posture (honest caveats)

- Runtime renderer payloads are treated as untrusted data and fail closed: the
  resident renderer and the contract gate share one allowlist and unsafe-payload
  scan, rejecting HTML strings, `javascript:` URLs, event-handler props,
  `dangerouslySetInnerHTML`, serialized React markers, package imports, foreign
  namespaces, and inline secret-bearing props
  (`docs/architecture/runtime-renderer.md`).
- Policy, approval, tool execution, memory writes, traces, and artifact provenance
  are owned by Jami Harness, not Studio UI; denied/pending states are display-only
  here (`docs/architecture/foundation-alignment.md`).
- There is no funded support commitment, SLA, or formal vulnerability-disclosure
  channel yet. This is foundation-stage software (`0.0.0`); treat it accordingly.

## Cross-Links

- Registry publishing runbook: `docs/operations/registry-publishing.md`
- Release notes: `docs/operations/release-notes.md`
- Public claims evidence: `docs/operations/public-claims-evidence.md`
- Changelog system: `docs/operations/changelog.md`
- Source-lock records: `docs/operations/source-lock-records.md`
- Account/env lanes: `docs/operations/account-and-env-lanes.md`

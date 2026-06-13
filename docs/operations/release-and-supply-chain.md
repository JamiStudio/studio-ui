# Release And Supply Chain

Status: Foundation policy
Last updated: 2026-06-13

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
3. Regenerate/check release artifacts from accepted source inputs:
   `pnpm release:artifacts:generate` writes `docs/generated/sbom.cdx.json` and
   `docs/generated/release-notes.md`; `pnpm release:artifacts:check` verifies
   they have not drifted. `pnpm release:packages:check` verifies publishable package
   manifests, npm pack dry-runs, and a clean local tarball install. `pnpm verify`
   includes these checks.
4. Before any publish, satisfy the supply-chain gates below and the human/account
   actions in `docs/operations/registry-publishing.md`.
5. Tag and publish only after the dry-run is `ready-to-stage`, the hosting/auth
   actions are resolved, and public claims map to evidence
   (`docs/operations/public-claims-evidence.md`).

Versions are `0.0.0` across the workspace. The five publishable `@jami-studio/*`
package manifests have `files` allowlists and public npm `publishConfig`, but
npm trusted-publisher setup failed closed with `E403`
(`POST https://registry.npmjs.org/-/package/@jami-studio%2f*/trust`). No npm
package artifact has been published.

## SBOM Policy

- **Current footprint.** The local release, registry, CLI, renderer, and workbench
  scripts still run on Node.js built-ins only. The `@jami-studio/ui` package now
  declares the third-party dependencies required for the authored Radix/React wrapper
  slice: `@radix-ui/react-label`, `@radix-ui/react-slot`, `react` as a peer/dev
  dependency, and `react-dom` for server-rendered wrapper tests. These are local
  wrapper/package dependencies, not runtime payload execution.
- **Local SBOM.** `pnpm sbom:generate` writes
  `docs/generated/sbom.cdx.json`; `pnpm sbom:check` verifies it. The artifact is a
  deterministic CycloneDX 1.7 JSON BOM generated locally from root/package/app
  manifests, `pnpm-lock.yaml`, the Node engine declaration, and a hash manifest of
  `packages/registry/generated`. It intentionally does not use `npm sbom` or add a
  generator dependency.
- **Consequence.** The current BOM is still small: the first-party components are
  the root workspace, `@jami-studio/*` packages, and the workbench app; the required
  runtime platform is the Node.js engine (`>=24` declared in `engines`); and the
  external package entries are the declared Radix/React wrapper dependencies. Lockfile
  resolution must be reviewed before publish, as recorded in the generated SBOM.
- **Before first publish.** Re-run `pnpm release:artifacts:generate`, review the
  SBOM, attach it to the release, and re-verify it carries no undeclared
  third-party component. Re-run the SBOM whenever a real dependency is added; a
  single added dependency changes the supply-chain risk class and must be reviewed
  against the lockfile before publish.

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

These require package-publish setup that is not done:

- Local npm auth currently returns `jamesnavinhill`; that is operator access, not
  package publishing readiness.
- `npm org ls jami-studio --json` returns `jamesnavinhill: owner` and
  `jamienavin: developer`, but `npm trust github ... --yes --json` fails with
  npm `E403` for all five `@jami-studio/*` packages. Public package claims remain
  blocked until that provider gate succeeds.
- A manual GitHub Actions publish/attestation workflow exists at
  `.github/workflows/release-packages.yml`, but the publish input remains
  fail-closed until npm trust succeeds.

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

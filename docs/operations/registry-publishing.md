# Registry Publishing Readiness And Runbook

Status: Foundation runbook
Last updated: 2026-06-09

## Purpose

Document the static registry publishing path for Studio UI: what would be served,
how its integrity is checked before staging, what is publishable now versus
source-pending, and the human/account actions a script cannot perform. No real
publish has happened. This runbook describes the readiness state and the steps,
not a completed release.

## What Gets Published

The registry distribution is **static generated JSON** served from the planned
`registry.jami.studio` endpoint. Nothing is rendered or executed server-side. The
publish source is the tracked, generated, shadcn-shaped bundle:

- `packages/registry/generated/registry.json` — the registry index.
- `packages/registry/generated/items/<name>.registry-item.json` — one per item.
- `packages/registry/generated/suites/<lane>.suite.json` — one per suite lane.

These are produced deterministically by `pnpm contracts:generate` from the source
token fixture and registry source items, and drift-checked by
`pnpm contracts:artifacts:check`. They are regenerated, never hand-edited.

The served URL layout (for example `/registry.json`, `/items/<name>.json`,
`/suites/<lane>.json`) is a publishing-time decision finalized when the host is
provisioned; the dry-run validates the generated source bundle, not a URL scheme.

## Dry-Run Check

`pnpm registry:publish:check` (`scripts/release/publish-dry-run.mjs`) is a
read-only readiness check. It publishes, fetches, and mutates nothing. It:

- confirms `registry.json` carries the shadcn `$schema`, a name, a homepage, and items;
- recomputes the SHA-256 of every embedded file `content` and asserts it matches
  the embedded `hash` (fails closed on any mismatch);
- runs a high-signal secret-shaped-content scan over every served byte (private-key
  blocks, cloud/access tokens, generic `secret`/`token`/`password`/`api_key`/
  `authorization` assignments) and never echoes a matched value;
- confirms every item has a generated per-item artifact and every suite a manifest;
- confirms a `LICENSE` file exists and every item declares a provenance license;
- classifies each item `installable` / `partial` / `source-pending` from real
  generated content (never fabricated);
- reports the served files with size and a byte hash, and the human/account actions
  it cannot perform.

It exits non-zero only on an integrity failure. Source-pending items and unresolved
account actions are honest readiness states, not failures. The check is part of
`pnpm verify`.

### Current dry-run status (2026-06-09)

```
publish dry-run: ready-to-stage
  registry: @jami-studio/registry -> https://registry.jami.studio
  items: 41 (41 publishable now, 0 source-pending)
  source-pending: (none)
  copied third-party source items: none
  served files: 72
  secret-shaped content: none
```

The 41 publishable items are: 1 factory theme, 3 selectable brand/template option
descriptors, 3 primitives, 4 resident components, 4 suite roots, 8 generated page
descriptors, and 18 generated block descriptors.

Read "publishable now" precisely: an item is listed when **its own served bytes are
complete and hash-verified**. The `jami-theme` item ships the four generated token
outputs as real, hashed content. The brand/template option descriptors ship authored
descriptor JSON with `canonicalBrand: false`; they are selectable default-kit options,
not final brand canon, and they do not redistribute logo source. The primitive and
component vocabulary items ship the authored `packages/ui` vocabulary metadata and
descriptor metadata, framework-neutral component factories, and tokenized styles
as real, hashed content. The four suite items ship complete, hashed
suite manifests. The generated page and block items ship complete, hashed descriptor
manifests derived from the authored suite shell sources. "Publishable now" still does
**not** assert Radix wrappers, a runtime React renderer, full React page/block
implementations, final visual identity, or hosted registry availability.

## Provenance And Hashes

- Every generated item carries `meta.provenance` with `source`, `license`,
  `reviewedAt`, and `copiedSource`. The current bundle is entirely `source: authored`,
  `license: MIT`, `copiedSource: false` — no lifted third-party source is
  redistributed.
- Every installable file carries a `sha256:` content hash; every item carries a
  `lifecycle.sourceHash`. `pnpm contracts:check` enforces the source hashes and the
  dry-run re-verifies the content hashes.
- See `docs/operations/release-and-supply-chain.md` for the SBOM, package
  provenance, and attestation policy that wraps these hashes.

## Hosting Target And Human/Account Actions

Preferred first target: Cloudflare Pages or equivalent Cloudflare static hosting
under the existing `jami-studio` account (see
`docs/operations/account-and-env-lanes.md`). The following actions are **not** done
and cannot be performed or verified by the dry-run:

- [ ] Provision the static host and DNS for `registry.jami.studio`.
- [ ] Validate the generated output against the official shadcn registry schema URL
      before the first real publish.
- [ ] Add a repo-local shadcn/Tailwind source-lock record before any public
      generated-source compatibility claim (`docs/operations/source-lock-records.md`).
- [ ] Define the cache-header and revisioned-item-URL policy in the registry
      lifecycle doc once publishing starts.
- [ ] Add a clean-project install smoke against the live hosted URL (today the CLI
      smoke runs against the local generated directory; remote fetch resolves to an
      explicit `registry-unavailable` state).

Do not write Cloudflare, npm, or DNS tokens into tracked files.

## Not Yet Claimed

No registry files are hosted. The CLI does not fetch a remote registry. No
cache/revision policy is finalized. The `registry.jami.studio` homepage is a
declared target in `registry.json`, not a live endpoint. Public generated-source
compatibility with shadcn/Tailwind versions stays gated on the source-lock record.

## Cross-Links

- Registry lifecycle: `docs/architecture/registry-lifecycle.md`
- CLI install lifecycle: `docs/operations/registry-install.md`
- Release and supply chain: `docs/operations/release-and-supply-chain.md`
- Public claims evidence: `docs/operations/public-claims-evidence.md`
- Account/env lanes: `docs/operations/account-and-env-lanes.md`

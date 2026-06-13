# Registry Publishing Readiness And Runbook

Status: Public static registry live
Last updated: 2026-06-13

## Purpose

Document the static registry publishing path for Studio UI: what is served, how
its integrity is checked, what is publishable, and which hosted behavior remains
unsupported. The public custom domain `https://registry.jami.studio` serves the
registry JSON and docs routes and is covered by hosted smoke evidence.

## What Gets Published

The registry distribution is **static generated JSON** served from the
`registry.jami.studio` endpoint. Nothing is rendered or executed server-side. The
publish source is the tracked, generated, shadcn-shaped bundle:

- `packages/registry/generated/registry.json` — the registry index.
- `packages/registry/generated/items/<name>.registry-item.json` — one per item.
- `packages/registry/generated/suites/<lane>.suite.json` — one per suite lane.

These are produced deterministically by `pnpm contracts:generate` from the source
token fixture and registry source items, and drift-checked by
`pnpm contracts:artifacts:check`. They are regenerated, never hand-edited.

The served URL layout is now generated for static hosting: `/registry.json`,
`/registry/items/<name>.registry-item.json`, `/registry/suites/<lane>.suite.json`,
docs preview pages, suite route pages, and the workbench/showcase preview.

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

`pnpm release:artifacts:check` is the companion release-readiness gate. It verifies
the local CycloneDX SBOM (`docs/generated/sbom.cdx.json`) and generated
`.changes` rollup (`docs/generated/release-notes.md`) have not drifted. It also is
part of `pnpm verify`. It does not publish, upload, attach, or attest anything.

`pnpm hosted:routes:check` builds `apps/workbench/dist/` and verifies the local
source artifacts for the registry JSON route, docs pages, workbench/showcase
page, and mounted suite app/page routes. It also validates
`hosted-route-manifest.json`, scans served bytes for secret-shaped content, and
fails if the manifest claims hosted workbench/suite routes, hosted persistence,
backend registration, or hosted runtime before those public URLs are live.

### Current dry-run status (2026-06-13)

```
publish dry-run: ready-to-stage
  registry: @jami-studio/registry -> https://registry.jami.studio
  items: 45 (45 publishable now, 0 source-pending)
  source-pending: (none)
  copied third-party source items: none
  served files: 106
  secret-shaped content: none
```

The 45 publishable items are: 1 factory theme, 3 selectable brand/template option
descriptors, 3 primitives, 4 resident components, 4 suite roots, 8 generated page
items, 18 generated block items, and 4 generated app implementation items.

Read "publishable now" precisely: an item is listed when **its own served bytes are
complete and hash-verified**. The `jami-theme` item ships the four generated token
outputs as real, hashed content. The brand/template option descriptors ship authored
descriptor JSON with `canonicalBrand: false`; they are selectable default-kit options,
not final brand canon, and they do not redistribute logo source. The primitive and
component vocabulary items ship the authored `packages/ui` vocabulary metadata and
descriptor metadata, framework-neutral component factories with inert child-slot
handling, and tokenized styles as real, hashed content. The four suite items
ship complete, hashed suite manifests. The generated app/page/block items ship
complete, hashed implementation and descriptor manifests derived from the
authored suite shell sources, `packages/ui/src/primitive-components.mjs`, and
local mounted React suite source at `packages/ui/src/suites.mjs`. Resident UI
items also embed authored Radix/React wrapper source; only wrappers that use
Radix Slot or Label declare those package dependencies. "Publishable now" now
includes local mounted React suite route evidence, but still does **not** assert
external hosted runtime, final visual identity, or hosted registry availability.

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

Current hosted target: Cloudflare Pages custom domain `https://registry.jami.studio`
under the `jami-studio` account.

- Canonical custom-domain URL: `https://registry.jami.studio`
- Registry index: `https://registry.jami.studio/registry.json`
- Live smoke: `pnpm hosted:live:check -- --base-url https://registry.jami.studio --cloudflare-project jami-registry --write-evidence docs/generated/hosted-live-smoke.json`

The following actions are **not** done:

- [ ] Validate the generated output against the official shadcn registry schema URL
      before making a specific shadcn-version compatibility claim.
- [ ] Add a repo-local shadcn/Tailwind source-lock record before any public
      generated-source compatibility claim (`docs/operations/source-lock-records.md`).
- [ ] Define the revisioned-item-URL policy in the registry lifecycle doc.
- [x] Deploy and smoke the hosted workbench/showcase and suite preview route artifacts.
- [ ] Implement hosted persistence/backend package registration before claiming
      cross-session workbench save/register behavior.
- [x] Add a clean-project install smoke against the live hosted URL. The live smoke
      fetched required registry/docs routes and installed a theme, primitive,
      page, block, and all four suite roots through the remote CLI path.
- [x] Deploy the registry/docs artifacts and smoke the `registry.jami.studio`
      custom-domain URLs.
- [x] Re-run `pnpm release:artifacts:check`, review the SBOM and generated release
      notes, and attach release artifacts through the accepted release workflow.

Do not write Cloudflare, npm, or DNS tokens into tracked files.

## Not Yet Claimed

Hosted static workbench/showcase and suite preview routes are claimed. Hosted
persistence, backend registration, and hosted suite runtime are not claimed. No
revisioned-item URL policy is finalized.
Public generated-source compatibility with specific shadcn/Tailwind versions
stays gated on source-lock records.

## Cross-Links

- Registry lifecycle: `docs/architecture/registry-lifecycle.md`
- CLI install lifecycle: `docs/operations/registry-install.md`
- Release and supply chain: `docs/operations/release-and-supply-chain.md`
- Public claims evidence: `docs/operations/public-claims-evidence.md`
- Account/env lanes: `docs/operations/account-and-env-lanes.md`

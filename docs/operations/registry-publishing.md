# Registry Publishing Readiness And Runbook

Status: Foundation runbook
Last updated: 2026-06-13

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

`pnpm hosted:routes:check` builds `apps/workbench/dist/` and verifies local
preview-hosted artifacts for the registry JSON route, docs pages, workbench/
showcase page, and mounted suite app/page routes. It also validates
`hosted-route-manifest.json`, scans served bytes for secret-shaped content, and
fails if any route is marked externally deployed before Cloudflare/DNS work is
actually complete. It is a preview-deployable artifact check, not public hosting.

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

Current hosted preview target: Cloudflare Pages project `studio-ui-registry` under
the `jami-studio` account.

- Canonical pages.dev URL: `https://studio-ui-registry.pages.dev`
- Latest deployment URL: `https://42662c6b.studio-ui-registry.pages.dev`
- Deployment ID: `42662c6b-b615-41cb-add7-7569ce5a8bb1`
- Live smoke: `pnpm hosted:live:check -- --base-url https://studio-ui-registry.pages.dev --cloudflare-project studio-ui-registry --cloudflare-deployment-id 42662c6b-b615-41cb-add7-7569ce5a8bb1 --write-evidence docs/generated/hosted-live-smoke.json`

The following actions are **not** done:

- [ ] Attach and validate DNS for `registry.jami.studio`.
- [ ] Validate the generated output against the official shadcn registry schema URL
      before the first real publish.
- [ ] Add a repo-local shadcn/Tailwind source-lock record before any public
      generated-source compatibility claim (`docs/operations/source-lock-records.md`).
- [ ] Define the cache-header and revisioned-item-URL policy in the registry
      lifecycle doc once publishing starts.
- [x] Add a clean-project install smoke against the live hosted URL. The live smoke
      fetched 16 routes and installed 42 registry graph items through the remote
      CLI path.
- [x] Deploy the preview artifacts checked by `pnpm hosted:routes:check` and smoke
      the live pages.dev URLs.
- [ ] Re-run `pnpm release:artifacts:check`, review the SBOM and generated release
      notes, and attach them only inside an actual release workflow.

Do not write Cloudflare, npm, or DNS tokens into tracked files.

## Not Yet Claimed

The custom domain `registry.jami.studio` is not attached or claimed. No
cache/revision policy is finalized. Public generated-source compatibility with
specific shadcn/Tailwind versions stays gated on source-lock records.

## Cross-Links

- Registry lifecycle: `docs/architecture/registry-lifecycle.md`
- CLI install lifecycle: `docs/operations/registry-install.md`
- Release and supply chain: `docs/operations/release-and-supply-chain.md`
- Public claims evidence: `docs/operations/public-claims-evidence.md`
- Account/env lanes: `docs/operations/account-and-env-lanes.md`

# Public Claims Evidence Map

Status: Active
Last updated: 2026-06-13

## Purpose

Every public or outward-facing claim about Studio UI must trace to reproducible
evidence: a generated artifact, a command result, a fixture gate, a package test, or
the workbench accessibility/visual smoke. This map is the register. If a claim is not
in this table with live evidence, it is not safe to make publicly.

## Claim → Evidence

| Public claim | Evidence | How to reproduce |
| --- | --- | --- |
| Token source generates deterministic CSS / Tailwind `@theme` / TS / shadcn `cssVars` | `packages/tokens/generated/*` + drift check | `pnpm contracts:artifacts:check` |
| Registry items validate against the Jami metadata contract | `packages/registry/fixtures/*` + schema gate | `pnpm contracts:check` |
| Registry output is shadcn-shaped with embedded content + `sha256` hashes | `packages/registry/generated/registry.json` | `pnpm registry:publish:check` |
| Suite pages and blocks are independently installable registry items | generated page/block item artifacts and CLI temp-project smoke | `pnpm --filter @jami-studio/cli test` |
| Suite app/page/block implementation manifests are generated from suite shells and primitive factories | generated `*.implementation.json` artifacts, registry item content hashes, contract gate, workbench evidence, CLI temp-project smoke | `pnpm contracts:check`; `pnpm --filter @jami-studio/workbench test`; `pnpm --filter @jami-studio/cli test` |
| Default-kit brand/template options are selectable and CLI-inspectable without claiming final brand canon | `registry/branding/*.brand-option.json`, generated `*-brand` registry items, workbench option cards, CLI temp-project smoke | `pnpm contracts:check`; `pnpm --filter @jami-studio/workbench test`; `pnpm --filter @jami-studio/cli test` |
| Resident UI primitives/components ship importable framework-neutral component factory source with inert child-slot handling | `packages/ui/src/primitive-components.mjs`, generated resident UI registry items, UI tests, workbench vocabulary evidence | `pnpm --filter @jami-studio/ui test`; `pnpm contracts:check`; `pnpm --filter @jami-studio/workbench test` |
| Current resident UI vocabulary items ship authored Radix/React wrapper source for local/package install | `packages/ui/src/radix-react-wrappers.mjs`, `packages/ui/src/radix-wrapper-evidence.mjs`, generated wrapper install content for all seven resident UI registry items, UI server-render tests, workbench wrapper evidence, renderer package-import negative fixture | `pnpm --filter @jami-studio/ui test`; `pnpm contracts:check`; `pnpm --filter @jami-studio/workbench test`; `pnpm --filter @jami-studio/workbench smoke` |
| Every embedded registry content hash recomputes exactly | publish dry-run hash re-verification | `pnpm registry:publish:check` |
| No secret-shaped content in the served registry bundle | publish dry-run secret scan (`secret-shaped content: none`) | `pnpm registry:publish:check` |
| No third-party source is redistributed | all items `copiedSource: false`; dry-run `copiedSourceItems: none` | `pnpm registry:publish:check` |
| Items are MIT-licensed and the repo carries a matching LICENSE | root `LICENSE`; package `license` fields; item `meta.provenance.license` | `pnpm registry:publish:check` (fails if LICENSE missing) |
| Local SBOM is generated from the package/app graph, lockfile, Node engine declaration, and generated registry bundle | `docs/generated/sbom.cdx.json` | `pnpm sbom:check` |
| Release-note rollup is generated from `.changes/` fragments | `docs/generated/release-notes.md` | `pnpm release:notes:check` |
| The renderer fails closed on unsafe/malformed payloads | renderer fixtures + `safe-payload.mjs` + unit tests | `pnpm --filter @jami-studio/renderer test` |
| Renderer/seam emit inert, non-executable, secret-safe output | `render.test.mjs` / `presentation.test.mjs` | `pnpm --filter @jami-studio/renderer test` |
| The CLI installs/updates/removes/migrates/diffs and verifies provenance | 18 temp-project smoke tests | `pnpm --filter @jami-studio/cli test` |
| The CLI provenance command verifies content hashes | `cli provenance <name>` (`state: verified`) | `node packages/cli/bin/studio-ui.mjs provenance jami-theme --registry packages/registry/generated --json` |
| The workbench renders the seams in a browser | static showcase + `node --test` gate | `pnpm --filter @jami-studio/workbench test` |
| The workbench supports always-live local token edits, discard/rename/import/inspector state, offline/online local status, and deterministic local artifacts | local overlay state reducer + `node --test` gate | `pnpm --filter @jami-studio/workbench test` |
| The workbench meets structural a11y + contrast targets | a11y/visual smoke report | `node apps/workbench/smoke/a11y-visual-smoke.mjs` |
| The full gate passes | aggregate verify | `pnpm verify` |
| Package contents are npm-pack ready and published as public npm packages with provenance metadata | package manifest gate, npm pack dry-runs, clean local tarball install, public npm metadata lookup | `pnpm release:packages:check` |
| The static registry is live at the `registry.jami.studio` custom domain and supports remote CLI install for theme, primitive, page, block, and suites | hosted custom-domain registry/docs route fetches, cache/header check, remote install smoke | `pnpm hosted:live:check -- --base-url https://registry.jami.studio --cloudflare-project jami-registry --write-evidence docs/generated/hosted-live-smoke.json` |
| The Studio UI GitHub release exists with downloadable release assets | GitHub release metadata and asset checksums | `gh release view v0.1.0 --repo studio-jami/studio-ui --json tagName,isDraft,isPrerelease,publishedAt,assets` |

## Latest Evidence Snapshot (2026-06-13)

- `pnpm verify` — pass (exit 0), all stages green, including `registry:publish:check`.
- `pnpm registry:publish:check` — `ready-to-stage`; 45 items (45 publishable now,
  0 source-pending); 106 served files; secret-shaped content: none; copied
  third-party source: none. The generated resident UI items embed the authored
  wrapper source; `button` and `text-field` declare the Radix Slot/Label
  dependencies they actually use.
- `pnpm release:artifacts:check` — pass (exit 0); local SBOM and generated
  `.changes` rollup are in sync with source inputs. It publishes nothing and
  executes no attestation.
- `pnpm release:packages:check` — pass (exit 0); five package dry-runs record
  `sha512` npm pack integrities, the clean local tarball install smoke passed,
  and public npm metadata for all five `@jami-studio/*@0.1.0` packages includes
  tarballs, integrity, and SLSA provenance metadata.
- `pnpm hosted:live:check -- --base-url https://registry.jami.studio --cloudflare-project jami-registry --write-evidence docs/generated/hosted-live-smoke.json`
  — pass (exit 0); required registry/docs routes fetched from the custom domain,
  registry `Content-Type` and `Cache-Control: public, max-age=300` checked, and
  the remote CLI installed a theme, primitive, page, block, and all four suite
  roots from the hosted registry URL. The same evidence records current 404s for
  the workbench/showcase and suite route URLs instead of claiming them.
- `gh release view v0.1.0 --repo studio-jami/studio-ui --json tagName,isDraft,isPrerelease,publishedAt,assets`
  — pass (exit 0); release `v0.1.0` is public and has `studio-ui-v0.1.0.tgz`
  plus `studio-ui-v0.1.0.tgz.sha256` assets.
- `node apps/workbench/smoke/a11y-visual-smoke.mjs` — 14/14 structural a11y, 4/4
  contrast, 5/5 screenshots (Microsoft Edge). Output is gitignored under
  `apps/workbench/output/`.
- Node engine: verified on Node 24.16.0 via `fnm use 24.16.0` and pnpm 10.33.2.

## Claims That Are NOT Yet Supported

These must not be stated as fact publicly until evidence exists (see
`docs/operations/release-notes.md` "Not Yet Claimed"):

- A runtime React renderer, hosted workbench/showcase route, hosted/persisted workbench editing, backend package registration, or hosted/full React suite runtime. Generated app/page/block implementation manifests, local mounted React suite route artifacts, and local resident wrapper source exist, but no public hosted workbench or suite runtime route is deployed.
- Specific shadcn/Tailwind version compatibility of the generated source (gated on a
  source-lock record).
- Hosted workbench save/register persistence or backend package registration.
- Harness runtime behavior (owned by Jami Harness, only displayed here).
- Any final branding or visual-identity canon claim. Selectable brand/template option descriptors exist,
  but they are exploratory choices only.

## Cross-Links

- Release notes: `docs/operations/release-notes.md`
- Release and supply chain: `docs/operations/release-and-supply-chain.md`
- Registry publishing: `docs/operations/registry-publishing.md`
- Development workflow (source-registry rule): `docs/operations/development-workflow.md`

# Studio UI Source-Lock Records

Status: Initial implementation intake
Last updated: 2026-06-09

## Purpose

The registry-root source-lock evidence file is the crossflow intake record. This file
records which drift-prone sources this Studio UI repo has actually depended on in
machine-readable contracts.

## Current Records

| Source area | Repo dependency in this pass | Root lock used | Local implementation posture |
| --- | --- | --- | --- |
| DTCG | Token fixtures use DTCG-shaped `$type`, `$value`, `$deprecated`, references, composite tokens, and `$extensions` metadata. | `C:\Users\james\dev\orgs\oss\registry\docs\operations\source-lock-evidence.md`, DTCG row checked 2026-06-09. | No external package adopted. `pnpm contracts:check` validates schema metadata, references, deprecation fixture coverage, contrast, and generated CSS, Tailwind `@theme`, TypeScript token-name, and shadcn `cssVars` drift checks. |
| shadcn registry | Registry item fixtures model install-time item metadata, install content, and compatibility posture; `@jami-studio/cli` installs from the generated registry. | Same root file, shadcn registry row checked 2026-06-09. | No shadcn package adopted and no hosted registry is claimed. Local shadcn-shaped `registry.json`, per-item artifacts (with embedded install `content`/`hash` where source resolves), and suite manifests are deterministic contract artifacts. The dependency-free CLI consumes them from the local directory; remote fetch is an explicit unsupported state. Future public publishing must validate against the official schema URL before closing registry publishing tasks. |
| Tailwind | Token fixture declares and generates the deterministic Tailwind `@theme` output target. | Same root file, Tailwind row checked 2026-06-09. | No Tailwind package adopted. The local `packages/tokens/generated/jami.tailwind.css` artifact is generated from the source token fixture and drift-checked by `pnpm contracts:check` and `pnpm contracts:artifacts:check`. |
| AG-UI / renderer intake | Renderer fixtures cover data-only payload and reference families that can later map to event streams. | Same root file, AG-UI row checked 2026-06-09. | No AG-UI package adopted. Fixtures reject arbitrary HTML, script-like payloads, event props, and package imports. |
| Resident component vocabulary | `packages/ui` defines authored dependency-light vocabulary metadata and tokenized CSS for the initial resident primitives/components. | Same root file, shadcn/Tailwind/component substrate rows checked 2026-06-09. | No Radix, shadcn, Base UI, or Agent-Native source was copied in this pass. Registry fixtures record `source: authored`, `license: MIT`, and `copiedSource: false`; `packages/ui/test/ui.test.mjs` checks vocabulary provenance, state/a11y metadata, token references, and hardcoded component color rejection. |
| Radix wrapper readiness | `packages/ui/src/radix-wrapper-readiness.mjs` records the source-locked readiness checklist for future Radix/React wrapper work across the resident vocabulary. | Official sources checked 2026-06-09: Radix Primitives introduction `https://www.radix-ui.com/primitives/docs`, Radix composition `https://www.radix-ui.com/primitives/docs/guides/composition`, Radix styling `https://www.radix-ui.com/primitives/docs/guides/styling`, shadcn registry introduction `https://ui.shadcn.com/docs/registry`, and shadcn registry item docs `https://ui.shadcn.com/docs/registry/registry-item-json`. | Readiness metadata only. No React or Radix package is declared, no source is copied, no wrapper file exists, and no wrapper is exposed through the runtime renderer. `packages/ui/test/ui.test.mjs` requires every resident component to stay `do-not-claim` until dependency, source, prop-schema, tokenized-style, browser smoke, registry install, and renderer non-execution evidence exists. |
| CycloneDX SBOM | `scripts/release/generate-release-artifacts.mjs` emits a checked local CycloneDX JSON BOM at `docs/generated/sbom.cdx.json`. | Official CycloneDX specification overview and JSON documentation checked 2026-06-09: `https://cyclonedx.org/specification/overview/` and `https://cyclonedx.org/docs/latest`. Coordinator source context also records current version 1.7, release date 2025-10-21, recognized `*.cdx.json` JSON file pattern, and official predicate type `https://cyclonedx.org/bom`. | No CycloneDX package and no `npm sbom` command are adopted. The local generator emits `bomFormat: "CycloneDX"`, `specVersion: "1.7"`, deterministic first-party package/app components, Node engine, lockfile hash, generated registry bundle hash, and explicit properties that no hosted registry, npm publish, or attestation is claimed. `pnpm sbom:check` and `pnpm release:artifacts:check` drift-check the artifact. |

## Refresh Rule

When code adopts a package, copies source, generates official registry output, or
claims hosted/published compatibility, add package version, URL, license, hash, and
command evidence here before marking the relevant roadmap task complete.

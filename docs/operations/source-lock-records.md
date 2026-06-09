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
| shadcn registry | Registry item fixture models install-time item metadata and compatibility posture. | Same root file, shadcn registry row checked 2026-06-09. | No shadcn package adopted and no hosted registry is claimed. Local shadcn-shaped `registry.json` and per-item generated artifacts are deterministic contract artifacts; future public publishing must validate against the official schema URL before closing registry publishing tasks. |
| Tailwind | Token fixture declares and generates the deterministic Tailwind `@theme` output target. | Same root file, Tailwind row checked 2026-06-09. | No Tailwind package adopted. The local `packages/tokens/generated/jami.tailwind.css` artifact is generated from the source token fixture and drift-checked by `pnpm contracts:check` and `pnpm contracts:artifacts:check`. |
| AG-UI / renderer intake | Renderer fixtures cover data-only payload and reference families that can later map to event streams. | Same root file, AG-UI row checked 2026-06-09. | No AG-UI package adopted. Fixtures reject arbitrary HTML, script-like payloads, event props, and package imports. |

## Refresh Rule

When code adopts a package, copies source, generates official registry output, or
claims hosted/published compatibility, add package version, URL, license, hash, and
command evidence here before marking the relevant roadmap task complete.

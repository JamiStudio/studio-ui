# Development Workflow

Status: Active
Last updated: 2026-06-09

## Purpose

Keep Studio UI development fast, uniform, and evidence-backed. Agents run checks in session
before code reaches GitHub. GitHub Actions exist as a manual fallback, not as the primary development
gate while minutes are limited.

## Source Registry

The repo should converge on a unified source registry rather than hand-maintained parallel docs.

- Token JSON, registry item manifests, package manifests, renderer schemas, suite manifests, artifact
  metadata, and accepted evidence packets own executable truth.
- Durable docs explain the source registry and generated outputs.
- Public docs, legal/support pages, marketing claims, user manuals, changelogs, architecture diagrams,
  system maps, install guides, and release notes must trace back to accepted source records.
- A generated surface is not accepted unless it records source inputs, generation time, generator version,
  verification state, and source commit.

Until implementation packages exist, `docs/` plus `.changes/` are the source canon. As packages land,
promote truth into machine-readable manifests and generate outward-facing surfaces from those manifests.

The registry-root source-lock record at
`C:\Users\james\dev\orgs\oss\registry\docs\operations\source-lock-evidence.md`
is the current crossflow intake record for drift-prone standards, packages, hosted services,
and release tooling. Studio UI docs may reference that record for planning and readiness, but
code-bearing work must add repo-local evidence for the exact dependency, package, source file,
registry format, or hosted target it uses before claiming an implementation gate is complete.

## Local-First Verification Ladder

Run the narrowest complete checks for the touched surface:

- Docs and plans: read back changed Markdown, `pnpm docs:check`, `git diff --check`.
- Tokens: schema validation, generation, contrast/dark-light parity checks, typecheck, unit tests.
- Registry: shadcn schema validation, Jami metadata validation, dependency graph checks, install smoke.
- UI/workbench: lint, typecheck, unit tests, build, browser smoke when the app exists.
- Renderer: payload schema tests, allowlist tests, invalid-prop fallback tests, injection guard tests.
- CLI: dry-run, diff, install, clean temporary-project smoke tests.
- Full gate: `pnpm verify`.

Every agent final response must report the exact checks run, results, unavailable commands, commit SHA,
and push result.

## CI Posture

- CI is manual fallback for now: use GitHub Actions only when a human or coordinator intentionally
  dispatches it.
- Do not rely on CI to catch workstream failures. The worker must run the ladder before commit and push.
- Automatic PR/push CI can be enabled later when development slows or GitHub minutes are no longer a constraint.
- For docs-only changes, the complete local gate is readback of changed Markdown, `pnpm docs:check`,
  and `git diff --check`. Implementation changes must add the relevant stronger local checks from
  the ladder above before push.

## No Stub Completion

Do not fake progress with placeholders, hidden demo data, disabled checks, broad compatibility shims, or
weakened validation. If real user input or account action is needed, pause the stream, record the exact
intervention needed, alert the human, then continue after it is resolved. Do not patch around it.

No-stub escalation applies to shared seams as well: unsupported renderer payloads, denied actions,
missing source-lock evidence, missing package auth, missing hosted-registry capability, or absent
compatibility fixtures must be represented as explicit blocked or missing-readiness states. They must
not be hidden behind permissive fallbacks, demo-only data, or downgraded validation.

## Diagrams And System Maps

- Architecture diagrams should be generated from source records where possible: token graph, registry
  dependency graph, renderer vocabulary, suite graph, install flow, and deployment manifests.
- Mermaid is the default durable text format for docs.
- Generated image exports are secondary artifacts and must name their source diagram.
- System maps should update in the same workstream as the source contracts or topology they describe.

## Changelog And Release Notes

- Production-meaningful changes require a `.changes/` fragment.
- Release notes are compiled from accepted fragments and evidence packets.
- Changelog entries should describe shipped behavior and verification, not aspirational status.

## Free Tooling Bias

Prefer free/local tooling first: `pnpm`, TypeScript, Node scripts, `rg`, Mermaid, JSON Schema, shadcn
registry validation, Vitest/Playwright when packages exist, `git diff --check`, and generated docs from
local manifests. Paid or hosted services should be adapters, publishing targets, or fallback gates rather
than the only way to validate correctness.

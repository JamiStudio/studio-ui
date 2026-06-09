---
type: feature
surface: cli
---

Add `@jami-studio/cli` (`packages/cli`), the Studio UI install/config CLI, and make the
registry install path real. The dependency-free CLI installs and maintains registry
distribution artifacts in a target project with an inspectable `studio-ui.config.json`
and `studio-ui.lock.json`, hash-based conflict detection, and provenance verification.
It covers the full lifecycle: `init`, `list`, `inspect`, `add`, `remove`, `update`,
`migrate`, `pin`/`unpin`, `lock`, `doctor`, and `provenance`. Policy, approvals, and
runtime execution stay harness-owned; the CLI only distributes and inspects UI artifacts.

To give the install path real content, adds a `jami-theme` registry item whose install
files are the generated token outputs (CSS variables, Tailwind `@theme`, TypeScript token
names, shadcn `cssVars`), and extends the contract generator to embed real file `content`
plus a `sha256` `hash` for any file whose source resolves on disk. Files whose source is
pending (for example the `button` primitive's `.tsx`) carry no content and are recorded as
source-pending descriptors, never fabricated.

Adds four suite foundation items — `solo-suite`, `business-ops-suite`, `mixed-media-suite`,
and `research-writing-suite` — as install-graph descriptors. Each declares its member items
via `registryDependencies`, ships a generated suite manifest, and lists its planned per-lane
surfaces as pending vocabulary. The generator now reads every source item in
`packages/registry/fixtures/valid` and drift-checks the new generated items and suite
manifests under `pnpm contracts:artifacts:check`.

Conflict handling is hash-based and non-destructive: a file on disk whose hash matches
neither the recorded lock hash nor the new registry content is a conflict that `add`,
`update`, and `remove` refuse to clobber without `--force`, with explicit rollback guidance.
Remote `https://registry.jami.studio` sources resolve to an explicit unsupported state
rather than a silent empty registry.

Adds `packages/cli/test/cli.test.mjs`: 15 deterministic temp-project smoke tests under the
OS temp dir exercising the real generated registry, and wires the CLI test into `pnpm verify`.
Documents the surface in `docs/operations/registry-install.md`, updates
`docs/architecture/registry-lifecycle.md` for the new items and content embedding, and
notes the CLI consumer in `docs/operations/source-lock-records.md`.

No browser, workbench app, or suite app shell exists in this repo yet, so no browser,
screenshot, or accessibility evidence is claimed. Suite items install their theme and
descriptor today; their page/block/component vocabulary is pending the primitive workstream
and surfaced as planned, not installed.

Verification: `pnpm docs:check`, `pnpm contracts:check`, `pnpm contracts:artifacts:check`,
`pnpm --filter @jami-studio/tokens test`, `pnpm --filter @jami-studio/registry test`,
`pnpm --filter @jami-studio/renderer test`, `pnpm --filter @jami-studio/cli test`,
`pnpm verify` (full gate, exit 0), and `git diff --check` all pass on this machine
(Node 22; pnpm prints an unsupported-engine warning for the `>=24` preference but the
run succeeds).

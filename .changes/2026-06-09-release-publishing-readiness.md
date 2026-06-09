---
type: ops
surface: repo
---

Add Stream 6 pass 1 release, static-registry publishing, and supply-chain readiness
over the accepted Stream 5 surfaces, without expanding product scope.

Adds a root MIT `LICENSE` and `license: "MIT"` fields on the root and every package
manifest so the existing registry item provenance claims (every item `source:
authored`, `copiedSource: false`, `license: MIT`) are backed by an actual license.

Adds `scripts/release/publish-dry-run.mjs` and the `pnpm registry:publish:check`
script, wired into `pnpm verify`. It is read-only and publishes nothing: it confirms
the generated `registry.json` is shadcn-shaped, recomputes the SHA-256 of every
embedded file `content` and asserts it matches the embedded `hash`, runs a
high-signal secret-shaped-content scan over every served byte (never echoing a
match), confirms each item has a generated artifact and each suite a manifest,
confirms a LICENSE file and per-item license exist, classifies items installable vs
source-pending from real generated content, and lists the human/account actions it
cannot perform. Current status after the suite page/block registry item pass:
`ready-to-stage`, 38 items (38 publishable now, 0 source-pending), 69 served
files, secret-clean, no copied third-party source.

Adds four operations docs: `registry-publishing.md` (static publishing runbook and
readiness, with the dry-run status and pending host/DNS/source-lock actions),
`release-and-supply-chain.md` (release flow, SBOM policy for the zero-dependency
footprint, source/license provenance, registry item hashes, and package
provenance/attestation policy gated on npm auth and trusted CI), `release-notes.md`
(foundation notes compiled from `.changes/` fragments with an explicit Not-Yet-Claimed
section), and `public-claims-evidence.md` (claim → reproducible-evidence register).
Registers the new docs in `docs:check`, links them from the README and repository
map, and updates the readiness checklist and the Workstream 9 statuses.

Honest scope: nothing is published. No hosted registry, no npm publish, no remote
CLI install, no runtime React renderer, no interactive workbench editing, no full
suite app shells, no harness runtime, and no branding are claimed. npm auth and the
`registry.jami.studio` static host remain pending human/account actions. Verification
gates were strengthened, not weakened.

Verification: `pnpm verify` (full gate, exit 0, including the new
`registry:publish:check`), `pnpm registry:publish:check` (`ready-to-stage`,
secret-clean), `node apps/workbench/smoke/a11y-visual-smoke.mjs` (14/14 structural
a11y, 4/4 contrast, 5/5 screenshots on Microsoft Edge), and `git diff --check`.
Node 22 on this machine; pnpm prints a non-fatal unsupported-engine warning for the
`>=24` preference but the run succeeds.

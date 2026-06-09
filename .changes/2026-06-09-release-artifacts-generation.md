---
type: ops
surface: repo
---

Add dependency-free local release artifact generation and checks for Workstream 9.

`scripts/release/generate-release-artifacts.mjs` now writes and checks
`docs/generated/sbom.cdx.json` plus `docs/generated/release-notes.md`.
The SBOM is CycloneDX 1.7 JSON generated from local package/app manifests,
`pnpm-lock.yaml`, the Node engine declaration, and a hash manifest of the generated
registry bundle. The release-note rollup is generated from `.changes/` fragments
and preserves legacy fragments without frontmatter under an explicit unclassified
section.

Adds targeted `pnpm sbom:check` and `pnpm release:notes:check`, wires
`pnpm release:artifacts:check` into `pnpm verify`, and updates release,
publishing, public-claims, source-lock, readiness, changelog, repository-map, and
roadmap docs. This publishes nothing, attaches no release assets, executes no
attestations, and does not claim a hosted registry, npm publish, hosted
persistence, backend registration, final brand canon, or harness runtime behavior.

Verification: `pnpm release:artifacts:check`; full verification must still run
before commit.

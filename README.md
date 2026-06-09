# Studio UI

Studio UI is the Jami.Studio UI foundation: primitive registry, token system,
workbench overlay, CLI install surface, runtime renderer, and installable suite packs.

Current foundation:

- Feasibility report: `docs/research/studio-ui-feasibility-report.md`
- Active roadmap: `docs/roadmaps/2026-06-07-studio-ui-production-shape-plan.md`
- Operating rules: `AGENTS.md`
- Product shape: `docs/architecture/studio-ui-product-shape.md`
- Repository map: `docs/architecture/repository-map.md`
- Token contract: `docs/architecture/token-contract.md`
- Registry lifecycle: `docs/architecture/registry-lifecycle.md`
- Runtime renderer contract: `docs/architecture/runtime-renderer.md`
- Harness compatibility contract: `docs/architecture/compatibility-contract.md`
- Account/env lanes: `docs/operations/account-and-env-lanes.md`
- Readiness checklist: `docs/operations/readiness-checklist.md`
- Changelog rules: `docs/operations/changelog.md`
- Registry publishing runbook: `docs/operations/registry-publishing.md`
- Release and supply chain: `docs/operations/release-and-supply-chain.md`
- Release notes: `docs/operations/release-notes.md`
- Public claims evidence: `docs/operations/public-claims-evidence.md`

License: MIT (`LICENSE`).

Run verification:

```powershell
pnpm verify
```

Static registry publish readiness (read-only, publishes nothing):

```powershell
pnpm registry:publish:check
```

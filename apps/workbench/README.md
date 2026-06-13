# @jami-studio/workbench

Studio UI's browser-renderable workbench surface. A dependency-free static
generator over the accepted seams: the generated token theme, the generated
registry and suite descriptors, the resident renderer, the workbench presentation
seam, and a local always-live editing overlay.
The overlay now carries a typed backend-registration contract/client seam:
`STUDIO_UI_WORKBENCH_BACKEND_URL` may provide a non-secret endpoint for
save/restore/register/export/import POSTs, while the default static build records
`config-missing` and keeps deterministic local fallback state.

See `docs/architecture/workbench-showcase.md` for the full contract.

## Commands

```
node apps/workbench/build.mjs                      # build dist/ (gitignored)
pnpm --filter @jami-studio/workbench test          # deterministic checks (in pnpm verify)
node apps/workbench/smoke/a11y-visual-smoke.mjs     # browser + a11y + visual smoke (separate)
```

## What it shows

- all four suite lanes as generated shell routes over their generated manifests,
  with remaining React app surfaces labelled as pending;
- the resident renderer output for the checked compatibility fixtures, including
  display-only action references and fail-closed invalid payloads;
- the workbench presentation panels for harness refs with operational status
  badges;
- generated color tokens and computed WCAG contrast ratios;
- `factory` / `light` / `dark` theme states driven by the generated tokens;
- compact local overlay controls for target/theme/dirty state, save, duplicate,
  restore, local register/export artifacts, close/reopen, and data-backed dock
  panels;
- backend registration evidence for the current runtime state:
  `config-missing` when no endpoint is configured, `hosted-unavailable` for
  failed hosted attempts, and `conflict` for HTTP 409 responses. Hosted success
  is typed but not claimed by the default generated artifact.

## Boundaries

No remote registry fetch, package-manager install, provider runtime, or harness
execution. Policy, tool execution, memory, and provenance stay owned by Jami
Harness; this surface only displays and configures. Pending suite vocabulary is
labelled, and registry member installability is read from generated content, never
assumed. Overlay state is static-runtime `localStorage`; it is not hosted
persistence or backend package registration. The backend seam is executable only
when `STUDIO_UI_WORKBENCH_BACKEND_URL` is supplied; no endpoint or hosted
persistence is configured in the repo-local default.

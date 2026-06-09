# @jami-studio/workbench

Studio UI's browser-renderable showcase surface. A dependency-free static
generator over the accepted Stream 5 seams: the generated token theme, the
generated registry and suite descriptors, the resident renderer, and the
workbench presentation seam.

See `docs/architecture/workbench-showcase.md` for the full contract.

## Commands

```
node apps/workbench/build.mjs                      # build dist/ (gitignored)
pnpm --filter @jami-studio/workbench test          # deterministic checks (in pnpm verify)
node apps/workbench/smoke/a11y-visual-smoke.mjs     # browser + a11y + visual smoke (separate)
```

## What it shows

- the `solo` lane as a live route over its generated manifest; the other three
  lanes as honest descriptor-only states with pending surfaces labelled;
- the resident renderer output for the checked compatibility fixtures, including
  display-only action references and fail-closed invalid payloads;
- the workbench presentation panels for harness refs with operational status
  badges;
- generated color tokens and computed WCAG contrast ratios;
- `factory` / `light` / `dark` theme states driven by the generated tokens.

## Boundaries

No remote registry fetch, package-manager install, provider runtime, or harness
execution. Policy, tool execution, memory, and provenance stay owned by Jami
Harness; this surface only displays and configures. Pending suite vocabulary and
source-pending registry members are labelled, never presented as installed.

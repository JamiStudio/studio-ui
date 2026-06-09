---
type: feature
surface: workbench
---

Add `apps/workbench`, Studio UI's first browser-renderable surface: a
dependency-free static showcase over the accepted Stream 5 seams. It consumes the
generated Jami factory theme (`packages/tokens/generated/jami.css`), the generated
registry items and suite descriptors (`packages/registry/generated/`), the
resident renderer, and the workbench presentation seam — no duplicated data, no
remote fetch, no package-manager install, no provider runtime, and no harness
execution.

The page renders the `solo` lane as a live route that reads its generated suite
manifest and resolves each member to real registry metadata (installable vs
source-pending state read from generated content), and renders the
`business-ops`, `mixed-media`, and `research-writing` lanes as honest
descriptor-only states with their planned surfaces labelled pending, not
installed. It serializes the resident renderer's output for the checked
compatibility fixtures (valid payloads render resident components; action
references render display-only with `executable: false`; denied actions render as
denied; unknown/unsafe/malformed payloads fail closed to the renderer-owned inert
fallback) and the presentation seam's descriptors for harness refs with their
operational status badges (ready, redacted, stale, empty, error, denied,
missing-source, loading). A redacted memory record's gated content is never
echoed. Theme states (`factory`, `light`, `dark`) are driven by the generated
semantic tokens; the page also displays the generated color tokens and computed
WCAG contrast ratios.

The build (`node apps/workbench/build.mjs`) emits a reproducible static
`apps/workbench/dist/` from generated artifacts and the fixture corpus. A
`node --test` gate (`apps/workbench/test/workbench.test.mjs`) asserts real-data
consumption, inert/escaped output, honest installed-vs-pending states, every
theme building with the correct active control, accessible structure (skip link,
landmarks, labelled groups, scoped headers, document language), responsive and
reduced-motion affordances, long-content wrapping, redacted-content gating, and
that the displayed contrast ratios recompute and meet their targets. The gate is
wired into `pnpm verify` and stays dependency-free and browserless.

The browser/visual/accessibility smoke
(`node apps/workbench/smoke/a11y-visual-smoke.mjs`) is a separate, documented
command, also dependency-free: it drives an already-installed Edge/Chrome in
headless mode to capture full-page screenshots per theme plus focus-ring and
narrow-viewport captures, and writes a structural accessibility + contrast report
under `apps/workbench/output/` (gitignored). It never silently claims visual
coverage it did not produce; axe-core is not run in this pass.

Documents the surface in `docs/architecture/workbench-showcase.md`, registers it
in `docs:check`, updates `docs/architecture/repository-map.md`, and updates the
"Not Yet Claimed" sections of `docs/architecture/workbench-presentation.md` and
`docs/architecture/runtime-renderer.md` to record that a static display surface
now consumes those seams without changing their ownership boundary.

This is not a full suite app shell, the per-lane suite page/block/component
vocabulary (pending Workstream 4), an interactive workbench editing app, a runtime
React renderer, or any harness runtime — none are claimed.

Verification: `pnpm docs:check`, `pnpm contracts:check`,
`pnpm contracts:artifacts:check`, `pnpm --filter @jami-studio/tokens test`,
`pnpm --filter @jami-studio/registry test`,
`pnpm --filter @jami-studio/renderer test`,
`pnpm --filter @jami-studio/cli test`,
`pnpm --filter @jami-studio/workbench test`, `pnpm verify` (full gate),
`node apps/workbench/smoke/a11y-visual-smoke.mjs` (14/14 structural a11y, 4/4
contrast, 5/5 screenshots on Microsoft Edge), and `git diff --check`.

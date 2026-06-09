# Workbench Showcase Surface

Status: Foundation surface
Last updated: 2026-06-09

## Purpose

`apps/workbench` is Studio UI's first browser-renderable surface. It is a
dependency-free static showcase that a developer or agent can open in a browser
to see and verify the accepted Stream 5 seams end to end:

- the generated Jami factory theme (`packages/tokens/generated/jami.css`),
- the generated registry items and suite descriptors
  (`packages/registry/generated/`),
- the resident renderer (`packages/renderer/src/render.mjs`), and
- the workbench presentation seam (`packages/renderer/src/presentation.mjs`).

It is the smallest real surface that lets the registry → renderer → presentation
loop be inspected visually and produce visual/accessibility evidence. It is not a
full suite application, and it claims no harness runtime.

## What It Is

- A static HTML generator (`apps/workbench/build.mjs`) and a small set of pure
  modules under `apps/workbench/src/`. It is dependency-free (Node built-ins
  only) and imports the resident renderer and presentation seam from the renderer
  package's public entry by relative path, so it reuses the real renderer rather
  than re-implementing it. The workspace runs every package directly with `node`
  and is not symlinked into `node_modules`, so a relative import is the
  deterministic, install-free way to consume the renderer.
- The page renders:
  - the `solo` lane as a live route that reads its generated suite manifest and
    resolves each member to real registry metadata (installable vs
    source-pending state read from generated content, never assumed);
  - the `business-ops`, `mixed-media`, and `research-writing` lanes as honest
    descriptor-only states with their planned surfaces labelled pending, not
    installed;
  - the resident renderer's output for the checked compatibility fixtures — a
    valid payload renders a real resident component, action references render
    display-only (`executable: false`), denied actions render as denied, and
    unknown/unsafe/malformed payloads fail closed to the renderer-owned inert
    fallback;
  - the workbench presentation seam's descriptors for harness refs (artifact
    views, evidence packets, run-event traces, memory records, context packs,
    action refs) with their operational status badges (ready, redacted, stale,
    empty, error, denied, missing-source, loading);
  - the generated color tokens and the computed WCAG contrast ratios for the key
    foreground/background pairs.
- Theme states are token-driven. The page maps an active theme
  (`factory`, `light`, `dark`) to the generated semantic tokens; the theme
  switcher is a first-party app-shell script that only toggles the document theme
  attribute — it wires no network, storage, action, or renderer behavior.

## What It Consumes (no duplicated data)

Everything displayed is loaded at build time from generated artifacts and the
checked fixture corpus. Nothing is hand-authored into the page:

- `packages/tokens/generated/jami.css`
- `packages/registry/generated/registry.json`
- `packages/registry/generated/suites/<lane>.suite.json`
- `packages/renderer/fixtures/compatibility/*`
- `packages/renderer/fixtures/presentation/*`

## Safety And Ownership

- **Inert and escaped.** The input it serializes is already JSON-inert (the
  renderer drops callbacks, event-handler props, HTML-like strings, and
  `javascript:` URLs). The generator re-escapes every echoed value at the HTML
  boundary as defense in depth, never emits an inline event handler, and never
  produces an executable control. A denied or display-only action is inert,
  labelled UI.
- **No invented behavior.** No remote registry fetch, package-manager install,
  provider runtime, or harness execution happens. Redaction, freshness, and
  policy denial are displayed from the harness ref, never decided here. A
  redacted memory record's gated content is never echoed.
- **Honest states.** Pending suite vocabulary and source-pending registry
  members are labelled as such; the surface never presents a planned page/block/
  component as installed.

## Build And Verify

- Build: `node apps/workbench/build.mjs` → `apps/workbench/dist/` (gitignored).
  Emits `index.html` (factory default, with the working theme switcher), one
  theme-locked `theme-<name>.html` per theme, a `focus.html` for focus-ring
  evidence, and `build-manifest.json`.
- Deterministic checks (part of `pnpm verify`):
  `pnpm --filter @jami-studio/workbench test` (`apps/workbench/test/workbench.test.mjs`,
  `node --test`). It asserts real-data consumption, inert/escaped output, honest
  installed-vs-pending states, every theme building with the correct active
  control, accessible structure (skip link, landmarks, labelled groups, scoped
  table headers, document language), responsive and reduced-motion affordances,
  long-content wrapping, redacted-content gating, and that the displayed WCAG
  contrast ratios recompute correctly and meet their targets.

## Browser, Visual, And Accessibility Evidence

The browser/visual/accessibility smoke is a separate, documented command and is
intentionally **not** part of `pnpm verify` (which stays dependency-free and
browserless):

```
node apps/workbench/smoke/a11y-visual-smoke.mjs
```

It is dependency-free: it drives an already-installed Chromium-family browser
(Microsoft Edge or Google Chrome; override with `STUDIO_UI_BROWSER`) in headless
mode and writes evidence under `apps/workbench/output/` (gitignored):

- `output/screenshots/theme-factory.png`, `theme-light.png`, `theme-dark.png` —
  full-page captures per theme (desktop width);
- `output/screenshots/focus.png` — keyboard `:focus-visible` ring evidence;
- `output/screenshots/responsive.png` — narrow-viewport single-column layout;
- `output/a11y-report.json` — the structural accessibility checks and the
  computed WCAG contrast results.

The structural audit covers keyboard/focus, ARIA landmarks and labels, scoped
headers, reduced motion, responsive layout, document language, and the
no-inline-handler / no-`javascript:`-URL inertness invariants. Contrast is
computed from the generated token hex values. If no browser is found the audit
still runs and screenshots are reported as skipped with the reason — the smoke
never silently claims visual coverage it did not produce. Axe-core is not run in
this pass; the accessibility evidence is the computed-contrast and structural
audit plus the rendered screenshots.

## Not Yet Claimed

This surface does not implement a full suite app shell, the per-lane suite
page/block/component vocabulary (pending Workstream 4), interactive workbench
editing/save flows, a runtime React renderer, a remote registry fetch, a
package-manager install, a provider runtime, or any harness execution. It renders
and displays accepted, generated, and fixture data only.

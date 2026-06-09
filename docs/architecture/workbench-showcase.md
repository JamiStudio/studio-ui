# Workbench Showcase Surface

Status: Foundation surface
Last updated: 2026-06-09

## Purpose

`apps/workbench` is Studio UI's first browser-renderable workbench surface. It
is a dependency-free static showcase plus an always-live local overlay that a
developer or agent can open in a browser to see and verify the accepted seams end
to end:

- the generated Jami factory theme (`packages/tokens/generated/jami.css`),
- the generated registry items and suite descriptors
  (`packages/registry/generated/`),
- the resident renderer (`packages/renderer/src/render.mjs`),
- the workbench presentation seam (`packages/renderer/src/presentation.mjs`), and
- the resident vocabulary handshake, prop schemas, React-style primitive
  descriptors, and framework-neutral component factories (`packages/ui/src`).

It is the smallest real surface that lets the registry → renderer → presentation
loop be inspected visually, edited through generated-token controls, and produce
visual/accessibility evidence. It is not a full suite application, and it claims
no harness runtime, hosted persistence, or backend package registration.

## What It Is

- A static HTML generator (`apps/workbench/build.mjs`) and a small set of pure
  modules under `apps/workbench/src/`. It is dependency-free (Node built-ins
  only) and imports the resident renderer and presentation seam from the renderer
  package's public entry by relative path, so it reuses the real renderer rather
  than re-implementing it. The workspace runs every package directly with `node`
  and is not symlinked into `node_modules`, so a relative import is the
  deterministic, install-free way to consume the renderer.
- The page renders:
  - all four lanes (`solo`, `business-ops`, `mixed-media`, and
    `research-writing`) as generated suite shell routes that read their
    generated suite manifests, resolve each member to real registry metadata,
    and display the authored app shell, route map, pages, blocks, component
    parts, install graph, primitive-factory implementation evidence, and
    long-content/empty/error states;
  - selectable default-kit brand/template options (`studio-console`,
    `editorial-studio`, `command-grid`) from generated registry theme items and
    authored descriptors under `registry/branding/`, including token deltas,
    workbench control values, fit/risk notes, and explicit non-canon status;
  - the resident renderer's output for the checked compatibility fixtures — a
    valid payload renders a real resident component, action references render
    display-only (`executable: false`), denied actions render as denied, and
    unknown/unsafe/malformed payloads fail closed to the renderer-owned inert
    fallback;
  - the vocabulary handshake and per-component prop schemas loaded from
    `packages/ui`, including primitive descriptor metadata, component-factory
    source evidence, and the invalid/unsupported state rules the renderer
    enforces;
  - the workbench presentation seam's descriptors for harness refs (artifact
    views, evidence packets, run-event traces, memory records, context packs,
    action refs) with their operational status badges (ready, redacted, stale,
    empty, error, denied, missing-source, loading);
  - the generated color tokens and the computed WCAG contrast ratios for the key
    foreground/background pairs.
- Theme states and overlay controls are token-driven. The page maps an active
  theme (`factory`, `light`, `dark`) to the generated semantic tokens, then the
  overlay updates CSS variables immediately for the live page. Brand-option
  selection applies descriptor-owned workbench control deltas locally; it does
  not mutate the factory token source or declare a final visual identity.
- The always-live overlay is first-party static-app code, not a renderer payload.
  It exposes a compact status bar with target, theme/preset, dirty/storage state,
  Save, Duplicate, Restore, Register, Export, and Close. Its docked panels cover
  Theme, Color, Typography, Layout, Surfaces, Components, Charts, Motion, Assets,
  and Registry. Panels are data-backed where current generated token, suite,
  component, fixture, and registry data exists; Charts explicitly reports that no
  chart registry item exists yet.
- `apps/workbench/src/workbench-state.mjs` owns deterministic state transitions.
  Draft state, close/open state, and saved state survive in `localStorage` in the
  static runtime. Save, Duplicate, Restore, Register, and Export create local
  state transitions and local artifacts only; exported/register artifacts include
  `backendPersistence: false`.

## What It Consumes (no duplicated data)

Everything displayed is loaded at build time from generated artifacts and the
checked fixture corpus. Nothing is hand-authored into the page:

- `packages/tokens/generated/jami.css`
- `packages/registry/generated/registry.json`
- `packages/registry/generated/suites/<lane>.suite.json`
- `packages/registry/generated/suites/<lane>/**/*.implementation.json`
- `registry/suites/<lane>/suite-shell.json` through generated suite manifests
- `registry/branding/*.brand-option.json` through generated registry theme items
- `packages/ui/src/vocabulary.mjs`
- `packages/ui/src/primitive-descriptors.mjs`
- `packages/ui/src/primitive-components.mjs`
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
- **Local artifacts only.** The overlay's register/export flows serialize a
  deterministic local workbench artifact for inspection. They do not publish,
  register a package, write a hosted record, call a backend, or persist outside
  the browser's local state.
- **Honest states.** Authored suite shell descriptors are labelled as generated
  shell routes, registry member installability is read from generated content,
  app/page/block implementation manifests are labelled as generated primitive-factory
  evidence rather than hosted runtime, brand options are labelled as selectable
  but not final canon, and the page still states that a hosted/full React suite
  runtime is pending.

## Build And Verify

- Build: `node apps/workbench/build.mjs` → `apps/workbench/dist/` (gitignored).
  Emits `index.html` (factory default, with the working theme switcher), one
  theme-locked `theme-<name>.html` per theme, a `focus.html` for focus-ring
  evidence, and `build-manifest.json`.
- Deterministic checks (part of `pnpm verify`):
  `pnpm --filter @jami-studio/workbench test` (`apps/workbench/test/workbench.test.mjs`,
  `node --test`). It asserts real-data consumption, generated shell rendering
  for all four lanes, inert/escaped output, honest install/runtime states, every
  theme building with the correct active control, accessible structure (skip
  link, landmarks, labelled groups, scoped table headers, document language),
  responsive and reduced-motion affordances, long-content wrapping,
  redacted-content gating, always-live overlay controls/panels, local draft state
  transitions, and that the displayed WCAG contrast ratios recompute correctly
  and meet their targets. It also asserts that generated suite implementation
  manifests are loaded from registry item content and keep hosted/React/harness
  runtime claims false, and that the vocabulary handshake, prop-schema version,
  component-factory status/source, and bad-prop fixture rejection are visible in
  the generated page.

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

This surface does not implement hosted/full React suite applications, hosted/persisted
editing, backend package registration, a runtime React renderer, a remote
registry fetch, Radix wrappers, a provider runtime, or any harness execution. It
renders, displays, and locally edits accepted, generated, authored-source,
primitive-factory implementation, and fixture data only.

# Component Vocabulary

Status: Foundation vocabulary
Last updated: 2026-06-09

## Purpose

`packages/ui` now owns the first authored resident primitive and component
vocabulary that Studio UI can reference from the renderer, registry, CLI, and
workbench. It includes dependency-light metadata, tokenized styles,
framework-neutral component factories, and a first Radix/React wrapper slice for
the `button`, `panel`, and `text-field` primitives. It is not a full wrapper
library for every resident component and not a suite shell set.

## Source

- Vocabulary metadata: `packages/ui/src/vocabulary.mjs`
- React-style primitive descriptors: `packages/ui/src/primitive-descriptors.mjs`
- Framework-neutral component factories: `packages/ui/src/primitive-components.mjs`
- Radix wrapper readiness contract: `packages/ui/src/radix-wrapper-readiness.mjs`
- Radix/React wrapper evidence: `packages/ui/src/radix-wrapper-evidence.mjs`
- Radix/React wrapper source: `packages/ui/src/radix-react-wrappers.mjs`
- Server-rendered wrapper examples: `packages/ui/src/radix-react-wrapper-examples.mjs`
- Tokenized resident styles: `packages/ui/src/styles.css`
- Package entry point: `packages/ui/src/index.mjs`
- Registry source items: `packages/registry/fixtures/valid/*.registry-item.json`
- Renderer allowlist: `packages/renderer/src/safe-payload.mjs`
- Test guard: `packages/ui/test/ui.test.mjs`

The current inventory is:

- `button` primitive for command and form action surfaces.
- `panel` primitive for card, dock, and grouped content surfaces.
- `text-field` primitive for labelled form input states.
- `data-list` component for table/list record display.
- `agent-panel` component for display-only agent status, denied, pending, and
  error states.
- `docs-source-panel` component for source, citation, document, and redaction
  display.
- `media-grid` component for responsive media and artifact galleries.

## Guarantees

Every vocabulary definition carries:

- `@jami-studio/ui` namespace and a registry item name.
- authored MIT provenance with `copiedSource: false`.
- token requirements from the generated Studio UI token set.
- ARIA role and label-source metadata.
- source-owned per-component prop schemas for renderer and workbench consumption.
- a vocabulary handshake version that pins accepted payload, vocabulary, and prop schema versions.
- importable non-executable component factory metadata in
  `packages/ui/src/primitive-components.mjs`, including `renderPrimitiveSpec` and
  `createJamiPrimitiveComponents(createElement)`.
- child-slot handling that treats caller-provided children as inert display data,
  never as caller-supplied element specs or executable props.
- state coverage for keyboard, focus visibility, ARIA, contrast, reduced motion,
  responsive layout, disabled, loading, invalid, empty, error, and long-content
  behavior.
- a source-locked Radix wrapper readiness record for each resident component.
  The record claims only the implemented `button`, `panel`, and `text-field`
  wrapper slice. The remaining resident components stay `do-not-claim` until
  React/Radix dependency, wrapper source, prop-schema parity, tokenized-style,
  browser smoke, registry install, and renderer non-execution evidence exists.

`packages/ui/src/styles.css` uses generated `--jami-*` token variables for
component colors, focus ring, spacing, radius, shadow, and motion. The UI test
rejects hardcoded component color literals in color-bearing declarations and
checks that every referenced token exists in the generated token output.

## Registry And Renderer

Each initial vocabulary item has a registry-addressable source fixture under
`packages/registry/fixtures/valid`. Generated registry artifacts embed the real
`packages/ui/src/vocabulary.mjs`, `packages/ui/src/primitive-descriptors.mjs`,
`packages/ui/src/primitive-components.mjs`, and `packages/ui/src/styles.css`
content with per-file SHA-256 hashes. The `button`, `panel`, and `text-field`
items also embed `packages/ui/src/radix-react-wrappers.mjs` and declare the
Radix Slot/Label npm dependencies needed to evaluate that installed source. The
other resident components do not embed wrapper source yet.

The renderer allowlist now accepts the authored resident names in addition to
the renderer's internal display-only components. It also imports the vocabulary
prop schemas and handshake from `packages/ui`: unsupported component names still
degrade to `unsupported`, while stale vocabulary handshakes, unsupported props,
wrong prop types, and invalid enum values fail closed to `invalid`. It still
produces inert, JSON-serializable render trees and does not execute actions or
mount a DOM.

The renderer still uses resident payload data and never imports the React/Radix
wrapper module. The invalid fixture
`packages/renderer/fixtures/compatibility/invalid/invalid-payload.radix-wrapper-import.json`
keeps wrapper package imports rejected at the renderer boundary.

The suite artifact generator also uses `renderPrimitiveSpec` from
`packages/ui/src/primitive-components.mjs` to emit installable app/page/block
implementation manifests under `packages/registry/generated/suites/<lane>/`.
Those manifests prove the authored suite shells compose resident primitives into
renderable, tokenized, display-only DOM specs. They are generated evidence, not a
mounted React app runtime.

## Not Yet Claimed

This pass does not ship wrappers for `data-list`, `agent-panel`,
`docs-source-panel`, or `media-grid`; Storybook; visual regression tooling for
every primitive; calendar/source-board shells; or full suite app shells. The
React/Radix wrapper slice is install-time/package code only, not a runtime React
renderer and not a suite application library. The foundation remains narrow:
source-owned vocabulary metadata, prop schemas, descriptor metadata, component
factories, a three-primitive wrapper slice, tokenized styles, registry items,
generated suite implementation manifests, renderer allowlist/schema references,
and tests that keep component colors, state metadata, handshake, prop schemas,
inert child slots, non-executable factory output, wrapper subset claims, and
renderer package-import rejection honest.

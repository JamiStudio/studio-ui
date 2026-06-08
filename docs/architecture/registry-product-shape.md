# Registry Product Shape

Status: Active foundation
Owner: Jami.Studio
Last updated: 2026-06-07

## Purpose

This document captures the durable product architecture for Studio UI Registry. The
active roadmap owns sequencing; this doc owns the stable shape that workstreams should
preserve.

## Product Surface

Studio UI Registry is:

- An owned shadcn-compatible `@jami-studio` registry.
- A DTCG-compatible token source system.
- A Radix-first shadcn primitive and component vocabulary.
- A resident runtime renderer for structured UI payloads.
- A CLI for installing themes, primitives, pages, apps, and suites.
- An always-live workbench overlay for editing, saving, restoring, exporting, and
  registering themes and packages.
- Four suite lanes: `solo`, `business-ops`, `mixed-media`, and `research-writing`.

## Foundation Relationship

Studio UI Registry is the UI/design-system sibling to Jami Agent Harness. The sibling
boundary is maintained in `docs/architecture/foundation-alignment.md`.

- Studio UI Registry owns tokenized UI, registry distribution, resident rendering,
  workbench editing, suite composition, and UI install flows.
- Jami Agent Harness owns agent runtime state, policy, approvals, tool execution, memory,
  artifacts, traces, evidence, and agent-facing CLI/SDK surfaces.
- Shared integration uses typed payload/action/artifact/theme/suite references. It does
  not allow arbitrary model-provided code or transfer runtime governance into UI packages.

## Registry Lifecycles

Studio UI Registry keeps build-time distribution separate from runtime rendering.

- Build-time: shadcn registry items install source into a consuming app.
- Runtime: resident components render validated structured payloads.
- Third-party/generative iframe UI: untrusted lane only.

shadcn registry items are install artifacts. They are not a request-path renderer and do
not execute arbitrary payloads.

Harness artifacts and action references may be displayed through the resident renderer
only after validation against the UI Registry vocabulary. Tool side effects and approval
decisions stay in the harness.

## Token System

Token source owns visual truth. Generated outputs are derived from the source token model:

- CSS variables
- Tailwind theme variables
- TypeScript types
- shadcn `cssVars`
- workbench control schemas
- registry theme items
- docs/reference artifacts

The factory theme family uses warm, soft, muted tones with `#C14D84` as the likely anchor
accent and rich blue-green support ranges. Factory themes avoid lime and yellow-green
ranges.

## Workbench Overlay

The workbench is a control overlay over the real app/page:

- Compact status bar while active.
- Collapsible docked control panels.
- Optional inspector focus for component/surface-specific tokens.
- Retained navigation across the app/site.
- Close/reopen behavior that preserves unsaved draft state.
- Explicit Save, Duplicate, Rename, Restore, Register, Export, and Close actions.

There is no preview/live toggle. Editing is always live; Save is persistence.

## Suite Taxonomy

The registry exposes lower-level parts and full-suite installs.

- `primitives`: base UI parts.
- `components`: composed reusable controls.
- `blocks`: larger page sections.
- `pages`: complete page compositions.
- `apps`: installable app shells.
- `suites`: full installable product experiences.

Suite lanes:

- `solo`: calendar, forms, docs, agent, tasks, simple CRM/content/admin surfaces.
- `business-ops`: staff, scheduling, forms, training, compliance, operations dashboards.
- `mixed-media`: assets, generation, editing, pipelines, review, publishing, libraries.
- `research-writing`: sources, notes, citations, briefs, documents, outlines, knowledge work.

## Package Naming

Use one public namespace:

- `@jami-studio/ui`
- `@jami-studio/tokens`
- `@jami-studio/registry`
- `@jami-studio/cli`

Registry item names carry suite identity:

- `@jami-studio/solo-suite`
- `@jami-studio/business-ops-suite`
- `@jami-studio/mixed-media-suite`
- `@jami-studio/research-writing-suite`

Separate suite namespaces or aliases require a later decision record.

## Source Policy

Builder.io / Agent-Native templates are a reference corpus to recompose. Do not copy source
without verifying license scope, attribution requirements, current upstream source, and
the exact files being lifted.

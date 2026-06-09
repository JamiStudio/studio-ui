# Registry Lifecycle

Status: Foundation contract
Last updated: 2026-06-09

## Purpose

`packages/registry` now owns the first Studio UI registry metadata contract around
the public `@jami-studio` namespace. This pass establishes checkable metadata and
package graph foundations without generating public shadcn output yet.

## Contract Source

- Schema: `packages/registry/schemas/registry-item.schema.json`
- Valid fixture: `packages/registry/fixtures/valid/button.registry-item.json`
- Negative fixtures: `packages/registry/fixtures/invalid/`
- Check command: `pnpm contracts:check`

## Required Metadata

Every registry item must carry:

- `@jami-studio/*` item name.
- item type: primitive, component, block, page, theme, font, app, or suite.
- lifecycle id, version, schema version, source hash, and migration notes.
- provenance source, license, review date, and copied-source status.
- compatibility posture for shadcn, Tailwind, and React.
- token requirements.
- install file targets.
- dependencies or an explicit empty dependency list.
- optional suite membership using the locked suite lanes.

The sample `@jami-studio/button` item also includes a UI-side `agentManifest`
with a renderable component and action slot declaration. Policy execution remains
harness-owned.

## Validation Behavior

`pnpm contracts:check` currently enforces namespace, item type, lifecycle fields,
provenance, compatibility ranges, token requirement shape, and install file presence.
The missing-provenance fixture proves that registry items cannot pass with anonymous
or unreviewed source metadata.

## Not Yet Claimed

This pass does not emit official `registry.json`, shadcn `registry-item.json`, item
hashes for release, install smokes, or generated cache/revision names. Later
registry implementation must validate generated output against the current official
shadcn schema and preserve the Jami metadata contract here.

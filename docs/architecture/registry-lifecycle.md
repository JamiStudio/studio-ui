# Registry Lifecycle

Status: Foundation contract
Last updated: 2026-06-09

## Purpose

`packages/registry` now owns the first Studio UI registry metadata contract around
the public `@jami-studio` namespace. It also emits deterministic local shadcn-shaped
registry artifacts from the validated source fixture.

## Contract Source

- Schema: `packages/registry/schemas/registry-item.schema.json`
- Valid fixture: `packages/registry/fixtures/valid/button.registry-item.json`
- Negative fixtures: `packages/registry/fixtures/invalid/`
- Generated artifacts: `packages/registry/generated/`
- Generate command: `pnpm contracts:generate`
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
or unreviewed source metadata. The check also enforces deterministic `sourceHash`
metadata and generated artifact drift for the local shadcn-shaped `registry.json`
and per-item output.

## Generated Outputs

The current generated outputs are local contract artifacts:

- `packages/registry/generated/registry.json`
- `packages/registry/generated/items/button.registry-item.json`

They preserve the shadcn-shaped distribution fields plus Jami lifecycle, token,
provenance, compatibility, and agent manifest metadata under `meta`.

## Not Yet Claimed

This pass does not publish official hosted registry files, run install smokes, or
generate cache/revision names. Later registry implementation must validate generated
output against the current official shadcn schema before public publishing and
preserve the Jami metadata contract here.

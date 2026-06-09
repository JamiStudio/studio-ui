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

## Source Items

The generator reads every `*.registry-item.json` under
`packages/registry/fixtures/valid` (sorted for determinism). The current source
items are:

- `button` (`primitive`) — source-pending: its `.tsx` source lands in the
  primitive/component workstream, so no install content is generated.
- `jami-theme` (`theme`) — installable: its files are the generated token
  outputs, so real install content and per-file hashes are embedded.
- `solo-suite`, `business-ops-suite`, `mixed-media-suite`,
  `research-writing-suite` (`suite`) — install-graph descriptors. Each declares
  its member items in `registryDependencies` and a `plannedSurfaces` list (the
  per-lane vocabulary that is pending), and ships a generated suite manifest as
  its single file.

## Generated Outputs

The current generated outputs are local contract artifacts:

- `packages/registry/generated/registry.json`
- `packages/registry/generated/items/<name>.registry-item.json` for every source item
- `packages/registry/generated/suites/<lane>.suite.json` install-graph manifests

They preserve the shadcn-shaped distribution fields plus Jami lifecycle, token,
provenance, compatibility, and agent manifest metadata under `meta`. For files
whose source resolves on disk, the generator embeds the real `content` and a
`sha256` `hash`; files whose source is pending carry neither. The `@jami-studio/cli`
install path consumes these embedded contents and hashes directly (see
`docs/operations/registry-install.md`).

## Not Yet Claimed

This pass does not publish official hosted registry files or generate
cache/revision names. The CLI install path is exercised by temp-project smoke
tests against the local generated registry, not a hosted endpoint. Later registry
implementation must validate generated output against the current official shadcn
schema before public publishing and preserve the Jami metadata contract here.

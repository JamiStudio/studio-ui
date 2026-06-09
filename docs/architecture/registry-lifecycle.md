# Registry Lifecycle

Status: Foundation contract
Last updated: 2026-06-09

## Purpose

`packages/registry` now owns the first Studio UI registry metadata contract around
the public `@jami-studio` namespace. It also emits deterministic local shadcn-shaped
registry artifacts from the validated source fixture.

## Contract Source

- Schema: `packages/registry/schemas/registry-item.schema.json`
- Valid fixtures: `packages/registry/fixtures/valid/*.registry-item.json`
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

The vocabulary items also include UI-side `agentManifest` metadata with
renderable component names and action slot declarations. Policy execution remains
harness-owned.

## Validation Behavior

`pnpm contracts:check` currently enforces namespace, item type, lifecycle fields,
provenance, compatibility ranges, token requirement shape, and install file presence.
The missing-provenance fixture proves that registry items cannot pass with anonymous
or unreviewed source metadata. The check also enforces deterministic `sourceHash`
metadata and generated artifact drift for the local shadcn-shaped `registry.json`
and per-item output. Generated suite page/block items are checked for exact
counts, dependency presence, installable content hashes, resident component
references, and nested manifest schemas.

## Source Items

The generator reads every `*.registry-item.json` under
`packages/registry/fixtures/valid` (sorted for determinism). The current source
items are:

- `button`, `panel`, `text-field` (`primitive`) — installable resident
  vocabulary items. Their source files resolve to `packages/ui/src/vocabulary.mjs`
  and `packages/ui/src/styles.css`, so real install content and per-file hashes
  are embedded.
- `data-list`, `agent-panel`, `docs-source-panel`, `media-grid` (`component`) —
  installable resident component vocabulary items backed by the same authored
  metadata and tokenized style source.
- `jami-theme` (`theme`) — installable: its files are the generated token
  outputs, so real install content and per-file hashes are embedded.
- `studio-console-brand`, `editorial-studio-brand`, and `command-grid-brand`
  (`theme`) — installable brand/template option descriptors under
  `registry/branding/`. They express selectable token deltas and default-kit
  presentation choices against the accepted token model. They are explicitly
  exploratory, authored, and not final brand canon; no logo source is
  redistributed.
- `solo-suite`, `business-ops-suite`, `mixed-media-suite`,
  `research-writing-suite` (`suite`) — install-graph descriptors. Each declares
  its member items in `registryDependencies`, including the generated standalone
  page and block items for that lane, and ships a generated suite manifest as its
  single file.
- Eight standalone suite page items (`page`) and eighteen standalone suite block
  items (`block`) are derived from the authored `registry/suites/*/suite-shell.json`
  source descriptors. Each item installs a generated JSON manifest under
  `studio-ui/suites/<lane>/pages/` or `studio-ui/suites/<lane>/blocks/`, carries
  authored MIT provenance, and depends on the lower-level resident vocabulary it
  needs.

## Generated Outputs

The current generated outputs are local contract artifacts:

- `packages/registry/generated/registry.json`
- `packages/registry/generated/items/<name>.registry-item.json` for every source item
- `packages/registry/generated/suites/<lane>.suite.json` install-graph manifests
- `packages/registry/generated/suites/<lane>/pages/*.page.json` standalone page
  manifests
- `packages/registry/generated/suites/<lane>/blocks/*.block.json` standalone
  block manifests

They preserve the shadcn-shaped distribution fields plus Jami lifecycle, token,
provenance, compatibility, and agent manifest metadata under `meta`. For files
whose source resolves on disk, the generator embeds the real `content` and a
`sha256` `hash`; files whose source is pending carry neither. The `@jami-studio/cli`
install path consumes these embedded contents and hashes directly (see
`docs/operations/registry-install.md`).

## Not Yet Claimed

This pass does not publish official hosted registry files, generate cache/revision
names, or ship full React/Radix implementations for every vocabulary, page, or block
item. The CLI install path is exercised by temp-project smoke tests against the local
generated registry, not a hosted endpoint. Later registry implementation must validate
generated output against the current official shadcn schema before public publishing
and preserve the Jami metadata contract here.

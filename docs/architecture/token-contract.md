# Token Contract

Status: Foundation contract
Last updated: 2026-06-09

## Purpose

`packages/tokens` now owns the first machine-readable Studio UI token contract
foundation. This is not the full token compiler. It is the checked contract spine
that later generation, workbench editing, registry theme items, and renderer theme
references must preserve.

## Contract Source

- Schema: `packages/tokens/schemas/token-set.schema.json`
- Valid fixture: `packages/tokens/fixtures/valid/jami-factory.tokens.json`
- Negative fixtures: `packages/tokens/fixtures/invalid/`
- Check command: `pnpm contracts:check`

The fixture follows the DTCG-shaped `$type` / `$value` model and records the
selected source-lock posture in `$extensions["studio-ui"]`: schema version,
DTCG report, migration metadata, and generated output targets.

## Required Token Families

The foundation check requires these early surfaces:

- `color.brand.accent`, anchored on `#C14D84`.
- warm neutral light/dark background and foreground tokens.
- semantic light and dark background, foreground, and accent references.
- typography, spacing, radius, shadow, motion, density, shell, and component-state
  examples.
- deprecated alias coverage through `$deprecated`.
- composite token coverage through the typography fixture.

## Validation Behavior

`pnpm contracts:check` currently enforces:

- schema URL and Studio UI extension metadata.
- schema version and migration metadata.
- generated output target declarations for CSS variables, Tailwind theme variables,
  TypeScript token maps, and shadcn `cssVars`.
- required semantic light/dark tokens.
- token reference resolution.
- foreground/background contrast at 4.5:1 for the initial semantic pairs.
- negative fixtures for broken references and contrast failures.

The check is intentionally local and dependency-free until the compiler package chooses
its runtime validation library.

## Not Yet Claimed

This pass does not generate CSS, Tailwind, TypeScript, shadcn theme files, workbench
control schemas, or registry theme items. Those outputs must be generated
mechanically from this token source in later passes and then added to `pnpm verify`.

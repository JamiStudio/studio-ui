# Registry Install And CLI Lifecycle

Status: Foundation contract
Last updated: 2026-06-09

## Purpose

`@jami-studio/cli` (`packages/cli`) is the install/config surface for the Studio
UI registry. It installs and maintains registry distribution artifacts — themes,
primitives, and suite descriptors — in a target project, with an inspectable
config and lockfile, hash-based conflict detection, and provenance verification.

The CLI is dependency-free (Node built-ins only) and consumes the real generated
registry under `packages/registry/generated`. It does not execute harness policy,
tools, approvals, or runtime actions; it only distributes and inspects UI
artifacts.

## Registry Source

The CLI reads a generated, shadcn-shaped registry directory containing
`registry.json` whose items carry install `files` with embedded `content` and a
`hash`. The default source is this repo's `packages/registry/generated`. A remote
`https://registry.jami.studio` source is **not fetched yet**: a remote spec
resolves to an explicit `registry-unavailable` state with the local-path
workaround, never a silent empty registry.

Installable vs source-pending:

- An item whose files all carry content (for example `jami-theme`, whose files
  are the generated token outputs, or `button`, whose authored vocabulary/style
  files are embedded) is `installable`: the CLI writes real bytes and records
  each file's content hash.
- An item whose files carry no content yet is `source-pending`: the CLI records
  it as a descriptor and never fabricates the missing source. The current
  generated registry has no source-pending items.
- An item with a mix is `partial`.

## Project State

The CLI writes two plain-JSON, user-readable files into the target project:

- `studio-ui.config.json` — install intent: `appTitle`, `suite`, `theme`,
  `registry` source, and `packageManager`.
- `studio-ui.lock.json` — what was installed: per-item `version`,
  `itemSchemaVersion`, `sourceHash`, `suite`, `sourceState`, `pinned`,
  `provenance`, and per-file recorded content `hash`. Items and files are sorted
  for stable diffs.

No hidden state is written.

## Commands

| Command | Behavior |
| --- | --- |
| `init` | Write `studio-ui.config.json` (`--title`, `--suite`, `--theme`, `--package-manager`, `--registry`, `--force`). Refuses to overwrite without `--force`. |
| `list` | List registry items with type, version, suite, and source state. |
| `inspect <name>` | Show lifecycle, provenance, compatibility, token requirements, install files, the resolved dependency graph, and any planned (pending) surfaces. |
| `add <name>` | Resolve the item's `registryDependencies` graph and install it. `--dry-run` plans without writing; `--force` overwrites conflicts. |
| `remove <name>` | Delete an installed item's files and lock entry. Refuses to delete locally modified files without `--force`. |
| `update [name]` | Compare lock entries to the registry and reinstall outdated items. `--dry-run` plans; `--force` overrides pins and conflicts. |
| `migrate [name]` | Report schema-version migrations from item `migrationNotes`; `--apply` records the migration and reinstalls content. |
| `pin` / `unpin` | Pin or unpin an installed item version (`--version`). Pinned items are skipped by `update` unless `--force`. |
| `lock` | Show lockfile status and on-disk drift. |
| `doctor` | Diagnose config, registry reachability, provenance integrity, schema/version drift, missing files, on-disk drift, pending source, and pins, with the next command to run. |
| `provenance <name>` | Verify registry content hashes against embedded content and on-disk installs, and surface license/source-lock posture. |

Global options: `--cwd <dir>` (target project) and `--registry <dir>` (registry
source). `--json` prints the structured result.

## Conflict Handling And Rollback

Install integrity is hash-based. For each managed file the CLI compares the
on-disk hash, the recorded lock hash, and the new registry content hash:

- new file → `create`; matching content → `unchanged`; on-disk matches the
  recorded lock hash but upstream changed → `update` (safe managed overwrite).
- on-disk matches neither the recorded hash nor the new content → `conflict`: a
  locally modified or unmanaged file. `add`/`update`/`remove` refuse to clobber
  it and print rollback guidance. `--force` overrides.

Rollback guidance is explicit: the lockfile records the expected content hash, so
a modified or removed file can be restored by re-running `add <name>` (with
`--force` when overwriting a local edit). There is no destructive operation
without an explicit `--force`.

## Verification

- `pnpm --filter @jami-studio/cli test` runs deterministic temp-project smoke
  tests under the OS temp dir covering init, list, install, suite-graph install
  with authored primitive source, dry-run, conflict refusal and forced overwrite,
  doctor drift detection, remove, update of outdated entries, pin/update
  interaction, migrate report/apply, provenance verification, remote-registry
  unsupported state, and unknown-item failure.
- The CLI test is part of `pnpm verify`.

## Not Yet Claimed

The CLI installs UI distribution artifacts only. It does not fetch a remote
registry, run a package manager, scaffold an app shell, render a browser
surface, or execute harness actions. Suite items install their theme and
descriptor today; their per-lane page/block/component vocabulary is pending the
primitive/component workstream and is surfaced as planned, not installed.

# Changelog System

Status: Active
Last updated: 2026-06-07

## Purpose

Studio UI uses `.changes/` fragments as the source for production-meaningful
change notes. Fragments keep workstream changes reviewable before a release note is
compiled.

## When To Add A Fragment

Add a `.changes/<slug>.md` fragment when a change affects:

- package source
- token schema or generated token outputs
- registry item schema or generated registry output
- CLI behavior
- runtime renderer behavior
- workbench overlay behavior
- suite packages
- scripts, package metadata, CI, release, or publishing behavior
- security, operations, docs, or account setup rules

Docs-only setup work can use a fragment when it changes durable operating behavior.

## Fragment Format

```markdown
---
type: docs|feature|fix|security|ops|chore
surface: tokens|registry|ui|renderer|cli|workbench|suites|docs|repo
---

Short plain-language description of the change.
```

## Release Notes

Release notes have a generated source rollup now:

```powershell
pnpm release:notes:generate
pnpm release:notes:check
```

The generated rollup lives at `docs/generated/release-notes.md` and is checked by
`pnpm verify` through `pnpm release:artifacts:check`. The curated release posture
stays in `docs/operations/release-notes.md`. Keep fragments as durable review
notes and do not delete them unless a release closeout explicitly consumes them.
Legacy fragments without frontmatter are preserved in the generated rollup under
an explicit `unclassified` section until a separate cleanup normalizes them.

## Rules

- Do not include secrets, account tokens, signed URLs, or private provider data.
- Keep fragments short and factual.
- Link to durable docs when a rule was promoted.
- Include verification evidence when a fragment describes behavior, automation, release,
  publishing, or registry output changes.

---
type: fix
surface: repo
---

Correct the local release-artifacts lane after a fresh audit: remove stale
hardcoded npm-auth text from the publish dry-run and release docs, keep package
publish readiness gated on `@jami-studio` scope confirmation plus a trusted CI
provenance workflow, and make generated release-note source fragments avoid
obsolete registry item/file counts. At that checkpoint no npm publish,
static-host publish, hosted registry, release attestation, hosted persistence,
backend registration, final brand canon, or harness runtime behavior was claimed;
later 2026-06-13 public release evidence supersedes the npm/static-host/hosted
registry portions while persistence, backend registration, final brand canon,
and harness runtime remain unclaimed.

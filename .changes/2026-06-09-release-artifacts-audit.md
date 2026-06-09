---
type: fix
surface: repo
---

Correct the local release-artifacts lane after a fresh audit: remove stale
hardcoded npm-auth text from the publish dry-run and release docs, keep package
publish readiness gated on `@jami-studio` scope confirmation plus a trusted CI
provenance workflow, and make generated release-note source fragments avoid
obsolete registry item/file counts. No npm publish, static-host publish, hosted
registry, release attestation, hosted persistence, backend registration, final
brand canon, or harness runtime behavior is claimed.

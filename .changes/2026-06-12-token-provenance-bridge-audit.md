---
type: patch
surface: contracts
---

Harden the generated token provenance bridge so contract validation checks the embedded `jami-theme` manifest schema, generator, source hash, exact output ids, output hashes, and hosted/package false claims, and the registry publish dry-run fails closed if served token provenance overclaims hosted registry or package publication.

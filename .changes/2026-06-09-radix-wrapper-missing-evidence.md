---
type: fix
surface: ui
---

Corrected Radix wrapper readiness metadata so per-component `missingEvidence`
only reports unchecked evidence. The full required-evidence checklist still
includes the completed source-lock record, but source-locked component records no
longer list that completed row as missing.

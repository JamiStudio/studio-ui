---
type: security
surface: hosted,workbench
---

Strengthen `pnpm hosted:routes:check` so the local hosted preview smoke scans every
generated workbench preview artifact for secret-shaped content, including registry item
copies and generated route files not listed as top-level hosted routes.

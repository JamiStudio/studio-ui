---
type: security
surface: renderer
---

Closed two fail-open gaps in the resident renderer compatibility check. `pnpm contracts:check`
now pins each fixture kind to its required renderer state, so a denied or pending-approval
action can no longer be mislabeled as a renderable surface, and the event-handler guard now
rejects lowercase HTML handler attributes (`onclick`/`onerror`/`onload`) alongside React-style
`onClick` casing, since both reach the DOM as executable handlers. Adds an invalid fixture for
the lowercase event-handler vector. This stays consumer-side contract validation: the resident
vocabulary is unchanged and no React renderer, browser surface, or harness execution exists yet.

Verification: `pnpm docs:check`, `pnpm contracts:check`, `pnpm contracts:artifacts:check`,
package tests for `@jami-studio/tokens`, `@jami-studio/registry`, `@jami-studio/renderer`,
`pnpm verify`, and `git diff --check`.

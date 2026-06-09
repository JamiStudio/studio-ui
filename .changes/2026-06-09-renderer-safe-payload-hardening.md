---
type: security
surface: renderer
---

Hardened the resident renderer compatibility contract against unsafe harness UI payloads.
`pnpm contracts:check` now fails closed on event-handler props, `dangerouslySetInnerHTML`,
`javascript:` URLs, foreign component namespaces, serialized React-element markers, and
inline secret-bearing props, and it adds a non-executable `pending_approval` action-display
fixture alongside the existing denied-action fixture. Rendering stays data-only and
consumer-side: Studio UI displays typed denied and approval states without executing
harness policy or tool side effects.

Verification: `pnpm docs:check`, `pnpm contracts:check`, `pnpm contracts:artifacts:check`,
package tests for `@jami-studio/tokens`, `@jami-studio/registry`, `@jami-studio/renderer`,
`pnpm verify`, and `git diff --check`.

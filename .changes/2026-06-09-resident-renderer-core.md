---
type: feature
surface: renderer
---

Add the smallest real resident renderer surface to `@jami-studio/renderer`. The new
`packages/renderer/src` module turns a validated, harness-originated structured payload
into an inert, JSON-serializable render tree built only from the resident allowlisted
vocabulary. It renders valid `uiPayload`s as resident components, surfaces denied /
pending-approval / `artifactView` / `themeRef` / `suiteRef` references as display-only
state, degrades unknown components to `unsupported`, fails closed to `invalid` on unsafe
or malformed payloads, and renders renderer faults as an `error` state. It never imports
or executes React, HTML, scripts, package imports, event handlers, `javascript:` URLs, or
inline secrets, never emits a callback or executable capability (a forged
`execution.canExecute` is dropped), and uses renderer-owned copy on rejected/error paths
instead of echoing untrusted payload text.

The security-critical allowlist, secret-key set, and unsafe-payload scan now live in a
single `safe-payload.mjs` guard that both the runtime renderer and
`scripts/contracts/validate-contracts.mjs` import, so the fixture gate and the renderer
cannot drift apart. Adds `node --test` unit + fixture smoke tests proving valid fixtures
render inert in their declared state, invalid fixtures fail closed, and denied/pending
states expose no executable callback.

This remains a dependency-free, framework-agnostic render core: no React renderer, browser
surface, or workbench app exists yet, so browser/screenshot/accessibility smoke does not
apply.

Verification: `pnpm docs:check`, `pnpm contracts:check`, `pnpm contracts:artifacts:check`,
`pnpm --filter @jami-studio/renderer test`, `pnpm --filter @jami-studio/tokens test`,
`pnpm --filter @jami-studio/registry test`, and `git diff --check`.

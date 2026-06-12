---
type: security
surface: ui
---

Hardened the authored Radix/React wrapper slice so unsafe passthrough DOM props are stripped before rendering. The wrappers now drop event-handler props, `dangerouslySetInnerHTML`, forged executable flags, and `javascript:` URL props while preserving the local wrapper/package boundary: renderer payload execution, hosted runtime, backend persistence, backend registration, and harness action execution remain unclaimed.


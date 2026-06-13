---
type: fix
surface: release
---

Keep Studio UI package metadata aligned with the canonical `studio-jami/studio-ui`
repository and the current non-publishing posture. Release artifact generation now
fails if a workspace manifest drops `private: true` or points at a non-canonical
repository before the Group E package release gates close.

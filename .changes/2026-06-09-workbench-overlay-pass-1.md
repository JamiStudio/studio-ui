# Workbench overlay pass 1

- Added the first always-live workbench overlay to `apps/workbench`: compact status
  bar, docked Theme/Color/Typography/Layout/Surfaces/Components/Charts/Motion/
  Assets/Registry panels, immediate generated-token CSS variable updates, and
  local close/reopen draft state.
- Added deterministic static-runtime Save, Duplicate, Restore, Register, and
  Export transitions with local-only artifacts marked as not backend persistence.
- Expanded workbench tests and docs so this pass does not claim hosted
  persistence, backend package registration, full React/Radix primitives, or full
  suite app shells.


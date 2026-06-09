# 2026-06-09 - Vocabulary prop-schema handshake

- Added source-owned per-component prop schemas, a vocabulary handshake, and
  descriptor-only React-style primitive metadata under `packages/ui`.
- Wired the resident renderer and contract gate to reject stale vocabulary
  handshakes, unsupported props, wrong prop types, and invalid enum values before
  emitting inert render output.
- Added negative renderer fixtures and workbench evidence for the vocabulary
  handshake and prop-schema validation without claiming Radix wrappers, rendered
  React primitives, hosted registry, or full suite applications.

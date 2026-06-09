## Verification

- Updated the root `pnpm verify` command to run the accepted Node-based checks directly, avoiding a recursive Windows pnpm shim failure while preserving the same docs, contract, publish dry-run, renderer, CLI, and workbench coverage.

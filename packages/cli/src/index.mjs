// Public surface of the Studio UI CLI.
//
// The CLI installs and inspects Studio UI registry distribution artifacts
// (themes, primitives, suite descriptors) into a target project, with an
// inspectable config and lockfile, hash-based conflict detection, and provenance
// verification. It does not execute harness policy, tools, or runtime actions.

export { run, parseArgs } from "./run.mjs";
export { Project } from "./project.mjs";
export { loadRegistry, resolveGraph, itemSourceState, defaultRegistrySpec } from "./registry.mjs";
export * as commands from "./commands.mjs";
export { sha256, shortName, SUITE_LANES, PACKAGE_MANAGERS, CLI_SCHEMA_VERSION } from "./util.mjs";

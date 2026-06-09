// Small dependency-free helpers shared across the CLI.

import { createHash } from "node:crypto";

export const CLI_SCHEMA_VERSION = "2026-06-09.cli-foundation";

export const SUITE_LANES = ["solo", "business-ops", "mixed-media", "research-writing"];
export const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"];

// Content hashes are how the CLI proves install integrity, detects locally
// modified files, and verifies provenance. One algorithm, used everywhere.
export function sha256(content) {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

// Registry item names are addressed without the namespace on the command line;
// the lockfile and config keep the short, registry-local name.
export function shortName(name) {
  return String(name ?? "").replace(/^@jami-studio\//, "");
}

export function isRemoteRegistry(spec) {
  return /^https?:\/\//i.test(String(spec ?? ""));
}

export function sortByKey(items, key) {
  return [...items].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
}

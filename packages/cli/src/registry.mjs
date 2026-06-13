// Registry source loader.
//
// The CLI installs from a generated shadcn-shaped registry: a directory holding
// `registry.json` whose items carry install file content + content hashes. By
// default the CLI points at this repo's `packages/registry/generated` output, so
// the install path operates on the real generated artifacts rather than a mock.
//
// Remote (`https://...`) sources are fetched synchronously through a tiny Node
// helper so the public CLI API can stay sync while hosted registry smokes still
// exercise the real network path. Non-HTTPS registries fail closed.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isRemoteRegistry, shortName } from "./util.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// <repo>/packages/cli/src -> <repo>/packages/registry/generated
export const defaultRegistrySpec = resolve(here, "..", "..", "registry", "generated");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function remoteRegistryUrl(location) {
  let parsed;
  try {
    parsed = new URL(location);
  } catch {
    return { ok: false, reason: `Remote registry source is not a valid URL: ${location}` };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "Remote registry sources must use https:// URLs." };
  }
  if (!parsed.pathname || parsed.pathname === "/") {
    parsed.pathname = "/registry.json";
  } else if (!parsed.pathname.endsWith(".json")) {
    parsed.pathname = `${parsed.pathname.replace(/\/+$/, "")}/registry.json`;
  }
  parsed.search = "";
  parsed.hash = "";
  return { ok: true, url: parsed.toString() };
}

function fetchRemoteRegistry(location) {
  const resolved = remoteRegistryUrl(location);
  if (!resolved.ok) {
    return {
      ok: false,
      kind: "remote",
      location,
      supported: false,
      reason: resolved.reason,
      items: new Map(),
    };
  }
  const script = `
    const response = await fetch(process.argv[1], { redirect: "follow" });
    if (!response.ok) throw new Error(\`HTTP \${response.status} \${response.statusText}\`);
    process.stdout.write(await response.text());
  `;
  let registry;
  try {
    registry = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", script, resolved.url], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    }));
  } catch (error) {
    return {
      ok: false,
      kind: "remote",
      location,
      supported: true,
      reason: `Remote registry fetch failed for ${resolved.url}: ${error.message}`,
      items: new Map(),
    };
  }
  const items = new Map();
  for (const item of registry.items ?? []) items.set(shortName(item.name), item);
  return { ok: true, kind: "remote", location, supported: true, registry, items };
}

// Resolve a registry spec to a usable catalog or an explicit unsupported/error
// state. Never throws for an expected-bad spec; the caller surfaces the state.
export function loadRegistry(spec = defaultRegistrySpec) {
  const location = spec ?? defaultRegistrySpec;

  if (isRemoteRegistry(location)) {
    return fetchRemoteRegistry(location);
  }

  const dir = isAbsolute(location) ? location : resolve(process.cwd(), location);
  const registryPath = join(dir, "registry.json");
  if (!existsSync(registryPath)) {
    return {
      ok: false,
      kind: "local",
      location: dir,
      supported: true,
      reason: `No registry.json found at ${registryPath}.`,
      items: new Map(),
    };
  }

  let registry;
  try {
    registry = readJson(registryPath);
  } catch (error) {
    return {
      ok: false,
      kind: "local",
      location: dir,
      supported: true,
      reason: `registry.json is not valid JSON: ${error.message}`,
      items: new Map(),
    };
  }

  const items = new Map();
  for (const item of registry.items ?? []) {
    items.set(shortName(item.name), item);
  }

  return { ok: true, kind: "local", location: dir, supported: true, registry, items };
}

// Resolve an item plus its registryDependencies into a flat, de-duplicated,
// dependency-first install graph. Reports any names that do not resolve so the
// caller can fail closed instead of installing a partial graph.
export function resolveGraph(registry, name) {
  const ordered = [];
  const seen = new Set();
  const missing = [];

  function visit(itemName) {
    const key = shortName(itemName);
    if (seen.has(key)) return;
    seen.add(key);
    const item = registry.items.get(key);
    if (!item) {
      missing.push(key);
      return;
    }
    for (const dep of item.registryDependencies ?? []) visit(dep);
    ordered.push(item);
  }

  visit(name);
  return { ordered, missing };
}

// Source-pending = a registry item whose install files carry no content yet
// (for example a primitive whose component source lands in a later workstream).
// The CLI records these as descriptors and never fabricates the missing source.
export function fileHasContent(file) {
  return typeof file?.content === "string";
}

export function itemSourceState(item) {
  const files = item.files ?? [];
  const withContent = files.filter(fileHasContent).length;
  if (files.length === 0 || withContent === 0) return "source-pending";
  if (withContent === files.length) return "installable";
  return "partial";
}

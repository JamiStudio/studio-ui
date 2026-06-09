// Target-project state: an inspectable config file and a lockfile.
//
// `studio-ui.config.json` records the project's install intent (app title,
// suite lane, theme, registry source, package manager). `studio-ui.lock.json`
// records exactly what was installed: per-item lifecycle/provenance and per-file
// content hashes. Both are plain JSON the user can read and diff; the CLI never
// writes hidden state.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { CLI_SCHEMA_VERSION, sortByKey } from "./util.mjs";

export const CONFIG_FILE = "studio-ui.config.json";
export const LOCK_FILE = "studio-ui.lock.json";

const CONFIG_SCHEMA = "https://jami.studio/schemas/cli/config.schema.json";
const LOCK_SCHEMA = "https://jami.studio/schemas/cli/lock.schema.json";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export class Project {
  constructor(cwd = process.cwd()) {
    this.cwd = resolve(cwd);
    this.configPath = join(this.cwd, CONFIG_FILE);
    this.lockPath = join(this.cwd, LOCK_FILE);
  }

  hasConfig() {
    return existsSync(this.configPath);
  }

  readConfig() {
    return this.hasConfig() ? readJson(this.configPath) : null;
  }

  writeConfig(config) {
    writeJson(this.configPath, { $schema: CONFIG_SCHEMA, ...config });
  }

  readLock() {
    if (!existsSync(this.lockPath)) {
      return { $schema: LOCK_SCHEMA, schemaVersion: CLI_SCHEMA_VERSION, registry: null, items: [] };
    }
    return readJson(this.lockPath);
  }

  writeLock(lock) {
    const items = sortByKey(lock.items ?? [], "name").map((item) => ({
      ...item,
      files: sortByKey(item.files ?? [], "target"),
    }));
    writeJson(this.lockPath, { $schema: LOCK_SCHEMA, schemaVersion: CLI_SCHEMA_VERSION, registry: lock.registry ?? null, items });
  }

  lockItem(lock, name) {
    return (lock.items ?? []).find((item) => item.name === name) ?? null;
  }

  // --- installed file IO (operates under the project dir) -------------------

  filePath(target) {
    return join(this.cwd, target);
  }

  readInstalledFile(target) {
    const path = this.filePath(target);
    return existsSync(path) ? readFileSync(path, "utf8") : null;
  }

  writeInstalledFile(target, content) {
    const path = this.filePath(target);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }

  removeInstalledFile(target) {
    const path = this.filePath(target);
    if (existsSync(path)) rmSync(path);
  }
}

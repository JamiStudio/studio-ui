// CLI argument parsing and dispatch.
//
// `run(argv, { cwd })` returns `{ code, result, lines }` and never calls
// process.exit, so the same entry point backs both the bin and the smoke tests.

import { loadRegistry } from "./registry.mjs";
import { Project } from "./project.mjs";
import * as commands from "./commands.mjs";
import { formatInspect, formatList, formatProvenance, formatResult } from "./format.mjs";

const BOOLEAN_FLAGS = new Set(["dry-run", "force", "apply", "json", "help"]);
const FLAG_ALIASES = new Map([["registry-url", "registry"]]);
const VALUE_FLAGS = new Set(["cwd", "registry", "registry-url", "title", "suite", "theme", "package-manager", "pm", "version"]);

export function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const rawKey = arg.slice(2);
      const key = FLAG_ALIASES.get(rawKey) ?? rawKey;
      if (BOOLEAN_FLAGS.has(key)) {
        flags[key] = true;
      } else if (VALUE_FLAGS.has(rawKey) || VALUE_FLAGS.has(key)) {
        flags[key] = argv[i + 1];
        i += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }
  return { command: positionals[0], positionals: positionals.slice(1), flags };
}

const USAGE = [
  "studio-ui <command> [name] [options]",
  "",
  "Commands:",
  "  init         Write studio-ui.config.json (--title --suite --theme --package-manager --registry --force)",
  "  list         List registry items",
  "  inspect      Show an item's lifecycle, provenance, graph, and files",
  "  add          Install an item and its graph (--dry-run --force)",
  "  remove       Remove an installed item (--force --dry-run)",
  "  update       Update installed items to the registry (--dry-run --force [name])",
  "  diff         Show planned install/update/file drift without writing",
  "  migrate      Report or apply schema-version migrations (--apply --force [name])",
  "  pin/unpin    Pin or unpin an installed item version (--version)",
  "  lock         Show lockfile status and on-disk drift",
  "  doctor       Diagnose config, registry, provenance, and file drift",
  "  provenance   Verify an item's source/content provenance",
  "",
  "Global options: --cwd <dir> --registry <dir|url> (alias: --registry-url)",
].join("\n");

function resolveRegistrySpec(flags, project) {
  if (flags.registry) return flags.registry;
  const config = project.readConfig();
  if (config?.registry) return config.registry;
  return undefined;
}

export function run(argv, { cwd = process.cwd() } = {}) {
  const { command, positionals, flags } = parseArgs(argv);
  const project = new Project(flags.cwd ?? cwd);

  if (!command || flags.help || command === "help") {
    return { code: command && !flags.help ? 1 : 0, result: null, lines: USAGE.split("\n") };
  }

  const registry = loadRegistry(resolveRegistrySpec(flags, project));
  const name = positionals[0];
  const opts = {
    dryRun: Boolean(flags["dry-run"]),
    force: Boolean(flags.force),
    apply: Boolean(flags.apply),
    title: flags.title,
    suite: flags.suite,
    theme: flags.theme,
    packageManager: flags["package-manager"] ?? flags.pm,
    version: flags.version,
  };

  let result;
  let formatter = formatResult;
  switch (command) {
    case "init":
      result = commands.init(project, registry, opts);
      break;
    case "list":
      result = commands.list(registry);
      formatter = formatList;
      break;
    case "inspect":
      result = commands.inspect(registry, name);
      formatter = formatInspect;
      break;
    case "add":
    case "install":
      result = commands.add(project, registry, name, opts);
      break;
    case "remove":
    case "rm":
      result = commands.remove(project, name, opts);
      break;
    case "update":
      result = commands.update(project, registry, name, opts);
      break;
    case "diff":
      result = commands.diff(project, registry, name);
      break;
    case "migrate":
      result = commands.migrate(project, registry, name, opts);
      break;
    case "pin":
      result = commands.pin(project, name, opts);
      break;
    case "unpin":
      result = commands.unpin(project, name);
      break;
    case "lock":
      result = commands.lockStatus(project);
      break;
    case "doctor":
      result = commands.doctor(project, registry);
      break;
    case "provenance":
      result = commands.provenance(project, registry, name);
      formatter = formatProvenance;
      break;
    default:
      return { code: 1, result: null, lines: [`Unknown command: ${command}`, "", USAGE] };
  }

  const lines = flags.json ? [JSON.stringify(result, null, 2)] : formatter(result);
  return { code: result.ok ? 0 : 1, result, lines };
}

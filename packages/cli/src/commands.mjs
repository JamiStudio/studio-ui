// Studio UI CLI lifecycle commands.
//
// Every command is a pure function over a Project (target-project state) and a
// loaded registry. Each returns a structured result `{ command, ok, status,
// summary, notes, data }` so the same logic backs both the formatted terminal
// output and the temp-project smoke tests. Commands never call process.exit.
//
// Install integrity is hash-based and honest:
//   - A registry file with embedded content installs real bytes; its content
//     hash is recorded in the lock.
//   - A source-pending file (no content yet) is recorded as a descriptor and
//     never fabricated.
//   - A file on disk whose hash matches neither the new content nor the recorded
//     lock hash is a conflict: the CLI refuses to clobber local edits without
//     --force and prints rollback guidance.
// Policy, approvals, and runtime execution stay in the harness; this CLI only
// installs and inspects UI distribution artifacts.

import { fileHasContent, itemSourceState, resolveGraph } from "./registry.mjs";
import { CLI_SCHEMA_VERSION, PACKAGE_MANAGERS, SUITE_LANES, sha256, shortName, sortByKey } from "./util.mjs";

function result(command, status, summary, { ok = true, notes = [], data = {} } = {}) {
  return { command, ok, status, summary, notes, data };
}

function note(level, code, message) {
  return { level, code, message };
}

function lifecycleOf(item) {
  return item.meta?.lifecycle ?? {};
}

function provenanceOf(item) {
  return item.meta?.provenance ?? {};
}

// --- per-file install planning ----------------------------------------------

function planFile(project, lockEntry, file) {
  const target = file.target;
  if (!fileHasContent(file)) {
    return { target, action: "pending" };
  }
  const content = file.content;
  const newHash = sha256(content);
  // Registry integrity: the embedded hash must match the embedded content.
  if (file.hash && file.hash !== newHash) {
    return { target, action: "registry-corrupt", newHash, declaredHash: file.hash };
  }
  const onDisk = project.readInstalledFile(target);
  const lockedHash = (lockEntry?.files ?? []).find((f) => f.target === target)?.hash ?? null;
  if (onDisk === null) {
    return { target, action: "create", newHash, content };
  }
  const existingHash = sha256(onDisk);
  if (existingHash === newHash) {
    return { target, action: "unchanged", newHash, content };
  }
  if (lockedHash && existingHash === lockedHash) {
    // We own this file and upstream content changed: a safe managed update.
    return { target, action: "update", newHash, existingHash, content };
  }
  // Unmanaged pre-existing file or locally modified install: do not clobber.
  return { target, action: "conflict", newHash, existingHash, content };
}

function planItem(project, lock, item) {
  const entry = project.lockItem(lock, shortName(item.name));
  const files = (item.files ?? []).map((file) => planFile(project, entry, file));
  return { item, entry, files };
}

function planBlocked(plan) {
  return plan.files.filter((f) => f.action === "conflict" || f.action === "registry-corrupt");
}

function buildLockEntry(item, files, { now, pinned }) {
  const lifecycle = lifecycleOf(item);
  const recordedFiles = files
    .filter((f) => f.action !== "pending" && f.action !== "registry-corrupt")
    .map((f) => ({ target: f.target, hash: f.newHash }));
  return {
    name: shortName(item.name),
    type: item.type,
    version: lifecycle.version ?? null,
    itemSchemaVersion: lifecycle.schemaVersion ?? null,
    sourceHash: lifecycle.sourceHash ?? null,
    suite: item.meta?.suite ?? null,
    sourceState: itemSourceState(item),
    pinned: Boolean(pinned),
    installedAt: now(),
    provenance: {
      source: provenanceOf(item).source ?? null,
      license: provenanceOf(item).license ?? null,
      reviewedAt: provenanceOf(item).reviewedAt ?? null,
      copiedSource: Boolean(provenanceOf(item).copiedSource),
    },
    files: sortByKey(recordedFiles, "target"),
  };
}

function applyItem(project, plan, { force }) {
  for (const file of plan.files) {
    if (file.action === "create" || file.action === "update") {
      project.writeInstalledFile(file.target, file.content);
    } else if (file.action === "conflict" && force) {
      project.writeInstalledFile(file.target, file.content);
    }
    // unchanged: already correct on disk; pending/registry-corrupt: never write.
  }
}

function upsertLockEntries(lock, entries) {
  const byName = new Map((lock.items ?? []).map((item) => [item.name, item]));
  for (const entry of entries) byName.set(entry.name, entry);
  return { ...lock, items: [...byName.values()] };
}

// --- init --------------------------------------------------------------------

export function init(project, registry, opts = {}) {
  if (project.hasConfig() && !opts.force) {
    return result("init", "exists", `${project.configPath} already exists`, {
      ok: false,
      notes: [note("blocked", "config-exists", "Pass --force to overwrite the existing config.")],
    });
  }
  const suite = opts.suite ?? null;
  const notes = [];
  if (suite && !SUITE_LANES.includes(suite)) {
    return result("init", "invalid", `Unknown suite lane ${suite}`, {
      ok: false,
      notes: [note("blocked", "bad-suite", `Suite must be one of: ${SUITE_LANES.join(", ")}.`)],
    });
  }
  const packageManager = opts.packageManager ?? "pnpm";
  if (!PACKAGE_MANAGERS.includes(packageManager)) {
    return result("init", "invalid", `Unknown package manager ${packageManager}`, {
      ok: false,
      notes: [note("blocked", "bad-pm", `Package manager must be one of: ${PACKAGE_MANAGERS.join(", ")}.`)],
    });
  }
  const config = {
    schemaVersion: CLI_SCHEMA_VERSION,
    appTitle: opts.title ?? "Studio UI App",
    suite,
    theme: opts.theme ?? null,
    registry: registry.location ?? null,
    packageManager,
  };
  if (suite && registry.ok && !registry.items.has(`${suite}-suite`)) {
    notes.push(note("warn", "suite-not-in-registry", `Suite item ${suite}-suite was not found in the registry.`));
  }
  project.writeConfig(config);
  return result("init", "created", `Wrote ${project.configPath}`, { data: { config }, notes });
}

// --- list / inspect ----------------------------------------------------------

export function list(registry) {
  if (!registry.ok) {
    return result("list", "registry-unavailable", registry.reason, {
      ok: false,
      notes: [note("blocked", "registry", registry.reason)],
    });
  }
  const items = [...registry.items.values()].map((item) => ({
    name: shortName(item.name),
    packageName: item.meta?.packageName ?? item.name,
    type: item.type,
    version: lifecycleOf(item).version ?? null,
    suite: item.meta?.suite ?? null,
    sourceState: itemSourceState(item),
    description: item.description ?? "",
  }));
  return result("list", "ok", `${items.length} registry item(s)`, {
    data: { items: sortByKey(items, "name") },
  });
}

export function inspect(registry, name) {
  if (!registry.ok) {
    return result("inspect", "registry-unavailable", registry.reason, { ok: false });
  }
  const item = registry.items.get(shortName(name));
  if (!item) {
    return result("inspect", "missing", `No registry item named ${shortName(name)}`, {
      ok: false,
      notes: [note("missing", "no-item", `Run "studio-ui list" to see available items.`)],
    });
  }
  const { ordered, missing } = resolveGraph(registry, name);
  const data = {
    name: shortName(item.name),
    packageName: item.meta?.packageName ?? item.name,
    type: item.type,
    suite: item.meta?.suite ?? null,
    lifecycle: lifecycleOf(item),
    provenance: provenanceOf(item),
    compatibility: item.meta?.compatibility ?? {},
    tokenRequirements: item.meta?.tokenRequirements ?? [],
    plannedSurfaces: item.meta?.plannedSurfaces ?? null,
    sourceState: itemSourceState(item),
    files: (item.files ?? []).map((f) => ({ target: f.target, hasContent: fileHasContent(f), hash: f.hash ?? null })),
    graph: ordered.map((dep) => shortName(dep.name)),
  };
  const notes = [];
  if (missing.length) notes.push(note("missing", "graph", `Unresolved graph members: ${missing.join(", ")}.`));
  if (data.sourceState !== "installable") {
    notes.push(note("pending", "source-pending", "Some install files have no source content yet."));
  }
  return result("inspect", "ok", `${data.name} (${data.type})`, { data, notes });
}

// --- add (install) -----------------------------------------------------------

export function add(project, registry, name, opts = {}) {
  const now = opts.now ?? (() => new Date().toISOString());
  if (!registry.ok) {
    return result("add", "registry-unavailable", registry.reason, {
      ok: false,
      notes: [note("blocked", "registry", registry.reason)],
    });
  }
  const { ordered, missing } = resolveGraph(registry, name);
  if (missing.length) {
    return result("add", "missing", `Cannot resolve install graph for ${shortName(name)}`, {
      ok: false,
      notes: missing.map((m) => note("missing", "no-item", `Registry item ${m} not found.`)),
    });
  }

  const lock = project.readLock();
  const plans = ordered.map((item) => planItem(project, lock, item));
  const conflicts = plans.flatMap((plan) =>
    planBlocked(plan).map((file) => ({ item: shortName(plan.item.name), ...file })),
  );

  const fileActions = plans.flatMap((plan) =>
    plan.files.map((file) => ({ item: shortName(plan.item.name), target: file.target, action: file.action })),
  );
  const data = { graph: ordered.map((i) => shortName(i.name)), fileActions, conflicts };

  if (opts.dryRun) {
    return result("add", "planned", `Dry run: ${fileActions.length} file action(s) across ${plans.length} item(s)`, {
      data,
      notes: conflicts.map((c) =>
        note("drift", "conflict", `${c.target} is locally modified or unmanaged; --force would overwrite it.`),
      ),
    });
  }

  if (conflicts.length && !opts.force) {
    return result("add", "conflict", `Refusing to overwrite ${conflicts.length} locally modified or unmanaged file(s)`, {
      ok: false,
      data,
      notes: [
        ...conflicts.map((c) => note("drift", "conflict", `${c.target} (item ${c.item}) differs from the recorded install.`)),
        note("rollback", "guidance", "Re-run with --force to overwrite, or restore the file and re-run. The lockfile records the expected content hash for recovery."),
      ],
    });
  }

  const registryCorrupt = plans.flatMap((p) => p.files.filter((f) => f.action === "registry-corrupt"));
  if (registryCorrupt.length) {
    return result("add", "registry-corrupt", "Registry content hash mismatch", {
      ok: false,
      data,
      notes: registryCorrupt.map((f) => note("blocked", "registry-corrupt", `${f.target} content does not match its declared hash.`)),
    });
  }

  const entries = [];
  for (const plan of plans) {
    applyItem(project, plan, { force: opts.force });
    entries.push(buildLockEntry(plan.item, plan.files, { now, pinned: plan.entry?.pinned }));
  }
  project.writeLock(upsertLockEntries({ ...lock, registry: registry.location }, entries));

  // Reflect install intent in config when the project has one.
  if (project.hasConfig()) {
    const config = project.readConfig();
    const root = registry.items.get(shortName(name));
    let changed = false;
    if (root?.type === "registry:theme") {
      config.theme = shortName(name);
      changed = true;
    }
    if (root?.type === "registry:suite" && root.meta?.suite) {
      config.suite = root.meta.suite;
      changed = true;
    }
    if (changed) project.writeConfig(config);
  }

  const pending = entries.filter((e) => e.sourceState === "source-pending");
  const notes = pending.map((e) =>
    note("pending", "source-pending", `${e.name} recorded as descriptor only; its source content is pending a later workstream.`),
  );
  return result("add", "installed", `Installed ${entries.length} item(s) for ${shortName(name)}`, { data, notes });
}

// --- remove ------------------------------------------------------------------

export function remove(project, name, opts = {}) {
  const lock = project.readLock();
  const entry = project.lockItem(lock, shortName(name));
  if (!entry) {
    return result("remove", "not-installed", `${shortName(name)} is not in the lockfile`, {
      ok: false,
      notes: [note("missing", "not-installed", `Nothing to remove.`)],
    });
  }
  const modified = [];
  for (const file of entry.files ?? []) {
    const onDisk = project.readInstalledFile(file.target);
    if (onDisk !== null && sha256(onDisk) !== file.hash) modified.push(file.target);
  }
  if (modified.length && !opts.force) {
    return result("remove", "conflict", `Refusing to delete ${modified.length} locally modified file(s)`, {
      ok: false,
      data: { modified },
      notes: [
        ...modified.map((t) => note("drift", "conflict", `${t} differs from the recorded install.`)),
        note("rollback", "guidance", "Re-run with --force to delete anyway, or back up the file first."),
      ],
    });
  }
  if (!opts.dryRun) {
    for (const file of entry.files ?? []) project.removeInstalledFile(file.target);
    const remaining = (lock.items ?? []).filter((item) => item.name !== entry.name);
    project.writeLock({ ...lock, items: remaining });
  }
  return result("remove", opts.dryRun ? "planned" : "removed", `Removed ${entry.name} (${(entry.files ?? []).length} file(s))`, {
    data: { name: entry.name, files: (entry.files ?? []).map((f) => f.target) },
    notes: [note("rollback", "guidance", `Reinstall with "studio-ui add ${entry.name}" to restore from the registry.`)],
  });
}

// --- update ------------------------------------------------------------------

function compareToRegistry(entry, registry) {
  const item = registry.items.get(entry.name);
  if (!item) return { state: "orphaned", item: null };
  const lifecycle = lifecycleOf(item);
  if (lifecycle.schemaVersion !== entry.itemSchemaVersion) return { state: "migration", item };
  if (lifecycle.version !== entry.version || lifecycle.sourceHash !== entry.sourceHash) {
    return { state: "outdated", item };
  }
  return { state: "current", item };
}

export function update(project, registry, name, opts = {}) {
  const now = opts.now ?? (() => new Date().toISOString());
  if (!registry.ok) {
    return result("update", "registry-unavailable", registry.reason, { ok: false });
  }
  const lock = project.readLock();
  const targets = name
    ? (lock.items ?? []).filter((i) => i.name === shortName(name))
    : lock.items ?? [];
  if (name && targets.length === 0) {
    return result("update", "not-installed", `${shortName(name)} is not installed`, { ok: false });
  }

  const plannedUpdates = [];
  const notes = [];
  for (const entry of targets) {
    const { state, item } = compareToRegistry(entry, registry);
    if (state === "orphaned") {
      notes.push(note("missing", "orphaned", `${entry.name} is no longer in the registry.`));
    } else if (state === "migration") {
      notes.push(note("migration", "schema", `${entry.name} needs migration (run "studio-ui migrate ${entry.name}").`));
    } else if (state === "current") {
      notes.push(note("ok", "up-to-date", `${entry.name} is up to date.`));
    } else if (state === "outdated") {
      if (entry.pinned && !opts.force) {
        notes.push(note("pinned", "pinned", `${entry.name} is pinned at ${entry.version}; --force to override.`));
      } else {
        plannedUpdates.push(item);
      }
    }
  }

  if (opts.dryRun || plannedUpdates.length === 0) {
    const status = plannedUpdates.length ? "planned" : "up-to-date";
    return result("update", status, `${plannedUpdates.length} item(s) to update`, {
      data: { plannedUpdates: plannedUpdates.map((i) => shortName(i.name)) },
      notes,
    });
  }

  // Apply: re-plan and write each outdated item (conflict-aware).
  const entries = [];
  const blocked = [];
  for (const item of plannedUpdates) {
    const plan = planItem(project, lock, item);
    if (planBlocked(plan).length && !opts.force) {
      blocked.push(shortName(item.name));
      continue;
    }
    applyItem(project, plan, { force: opts.force });
    const prev = project.lockItem(lock, shortName(item.name));
    entries.push(buildLockEntry(item, plan.files, { now, pinned: prev?.pinned }));
  }
  if (entries.length) project.writeLock(upsertLockEntries(lock, entries));
  for (const b of blocked) notes.push(note("drift", "conflict", `${b} has local modifications; --force to overwrite.`));
  return result("update", entries.length ? "updated" : "blocked", `Updated ${entries.length} item(s)`, {
    ok: blocked.length === 0,
    data: { updated: entries.map((e) => e.name), blocked },
    notes,
  });
}

// --- diff --------------------------------------------------------------------

export function diff(project, registry, name) {
  if (!registry.ok) return result("diff", "registry-unavailable", registry.reason, { ok: false });
  const lock = project.readLock();
  const requestedName = name ? shortName(name) : null;
  const entries = lock.items ?? [];
  const targets = requestedName
    ? entries.filter((entry) => entry.name === requestedName)
    : entries;
  const notes = [];
  const itemDiffs = [];

  if (requestedName && targets.length === 0) {
    const item = registry.items.get(requestedName);
    if (!item) {
      return result("diff", "missing", `No installed or registry item named ${requestedName}`, {
        ok: false,
        notes: [note("missing", "no-item", `Run "studio-ui list" to see available items.`)],
      });
    }
    const installPlan = planItem(project, lock, item);
    const fileActions = installPlan.files.map((file) => ({
      target: file.target,
      action: file.action,
      newHash: file.newHash ?? null,
      existingHash: file.existingHash ?? null,
    }));
    return result("diff", "planned", `${fileActions.length} file action(s) for ${requestedName}`, {
      data: { items: [{ name: requestedName, state: "not-installed", fileActions }] },
      notes: [note("pending", "not-installed", `${requestedName} is not installed; diff shows install actions.`)],
    });
  }

  for (const entry of targets) {
    const registryItem = registry.items.get(entry.name);
    if (!registryItem) {
      itemDiffs.push({ name: entry.name, state: "orphaned", fileActions: [] });
      notes.push(note("missing", "orphaned", `${entry.name} is installed but no longer in the registry.`));
      continue;
    }
    const plan = planItem(project, lock, registryItem);
    const fileActions = plan.files.map((file) => ({
      target: file.target,
      action: file.action,
      newHash: file.newHash ?? null,
      existingHash: file.existingHash ?? null,
    }));
    const lifecycle = lifecycleOf(registryItem);
    const state =
      lifecycle.schemaVersion !== entry.itemSchemaVersion
        ? "migration"
        : lifecycle.version !== entry.version || lifecycle.sourceHash !== entry.sourceHash
          ? "outdated"
          : fileActions.some((file) => file.action !== "unchanged")
            ? "file-drift"
            : "clean";
    if (state === "migration") notes.push(note("migration", "schema", `${entry.name} needs migration.`));
    if (state === "outdated") notes.push(note("drift", "registry", `${entry.name} differs from the registry.`));
    if (state === "file-drift") notes.push(note("drift", "file", `${entry.name} has local file drift.`));
    itemDiffs.push({ name: entry.name, state, fileActions });
  }

  const changed = itemDiffs.filter((item) => item.state !== "clean");
  return result("diff", changed.length ? "changes" : "clean", `${changed.length} changed item(s)`, {
    data: { items: itemDiffs },
    notes,
  });
}

// --- migrate -----------------------------------------------------------------

export function migrate(project, registry, name, opts = {}) {
  const now = opts.now ?? (() => new Date().toISOString());
  if (!registry.ok) return result("migrate", "registry-unavailable", registry.reason, { ok: false });
  const lock = project.readLock();
  const targets = name ? (lock.items ?? []).filter((i) => i.name === shortName(name)) : lock.items ?? [];
  const pending = [];
  const notes = [];
  for (const entry of targets) {
    const { state, item } = compareToRegistry(entry, registry);
    if (state === "migration") {
      pending.push({ entry, item });
      notes.push(
        note("migration", "schema", `${entry.name}: ${entry.itemSchemaVersion} -> ${lifecycleOf(item).schemaVersion}. ${lifecycleOf(item).migrationNotes ?? ""}`.trim()),
      );
    }
  }
  if (pending.length === 0) {
    return result("migrate", "none", "No migrations pending", { notes });
  }
  if (!opts.apply) {
    return result("migrate", "pending", `${pending.length} migration(s) pending`, {
      data: { pending: pending.map((p) => p.entry.name) },
      notes: [...notes, note("migration", "guidance", "Re-run with --apply to record the migration and reinstall content.")],
    });
  }
  const entries = [];
  for (const { item } of pending) {
    const plan = planItem(project, lock, item);
    if (planBlocked(plan).length && !opts.force) {
      notes.push(note("drift", "conflict", `${shortName(item.name)} has local modifications; --force to overwrite.`));
      continue;
    }
    applyItem(project, plan, { force: opts.force });
    const prev = project.lockItem(lock, shortName(item.name));
    entries.push(buildLockEntry(item, plan.files, { now, pinned: prev?.pinned }));
  }
  if (entries.length) project.writeLock(upsertLockEntries(lock, entries));
  return result("migrate", "applied", `Applied ${entries.length} migration(s)`, {
    data: { migrated: entries.map((e) => e.name) },
    notes,
  });
}

// --- pin / unpin -------------------------------------------------------------

export function pin(project, name, opts = {}) {
  const lock = project.readLock();
  const entry = project.lockItem(lock, shortName(name));
  if (!entry) return result("pin", "not-installed", `${shortName(name)} is not installed`, { ok: false });
  entry.pinned = true;
  if (opts.version) entry.pinnedVersion = opts.version;
  project.writeLock(lock);
  return result("pin", "pinned", `Pinned ${entry.name} at ${entry.pinnedVersion ?? entry.version}`, {
    data: { name: entry.name, version: entry.pinnedVersion ?? entry.version },
  });
}

export function unpin(project, name) {
  const lock = project.readLock();
  const entry = project.lockItem(lock, shortName(name));
  if (!entry) return result("unpin", "not-installed", `${shortName(name)} is not installed`, { ok: false });
  entry.pinned = false;
  delete entry.pinnedVersion;
  project.writeLock(lock);
  return result("unpin", "unpinned", `Unpinned ${entry.name}`, { data: { name: entry.name } });
}

// --- lock (status) -----------------------------------------------------------

export function lockStatus(project) {
  const lock = project.readLock();
  const items = (lock.items ?? []).map((entry) => {
    const drift = (entry.files ?? []).filter((file) => {
      const onDisk = project.readInstalledFile(file.target);
      return onDisk === null || sha256(onDisk) !== file.hash;
    });
    return {
      name: entry.name,
      version: entry.version,
      pinned: Boolean(entry.pinned),
      sourceState: entry.sourceState,
      files: (entry.files ?? []).length,
      drift: drift.map((f) => f.target),
    };
  });
  const dirty = items.some((i) => i.drift.length);
  return result("lock", dirty ? "drift" : "clean", `${items.length} locked item(s)`, {
    ok: !dirty,
    data: { registry: lock.registry, items },
  });
}

// --- doctor ------------------------------------------------------------------

export function doctor(project, registry) {
  const notes = [];
  let problems = 0;

  // Config
  const config = project.readConfig();
  if (!config) {
    notes.push(note("warn", "no-config", `No ${"studio-ui.config.json"}; run "studio-ui init".`));
  } else {
    if (config.schemaVersion !== CLI_SCHEMA_VERSION) {
      notes.push(note("warn", "config-schema", `Config schemaVersion ${config.schemaVersion} != ${CLI_SCHEMA_VERSION}.`));
    }
    if (config.suite && !SUITE_LANES.includes(config.suite)) {
      notes.push(note("warn", "config-suite", `Config suite ${config.suite} is not a known lane.`));
    }
  }

  // Registry
  if (!registry.ok) {
    notes.push(note("blocked", "registry", registry.reason));
    problems += 1;
  } else {
    notes.push(note("ok", "registry", `Registry reachable at ${registry.location} (${registry.items.size} item(s)).`));
  }

  // Installed items
  const lock = project.readLock();
  for (const entry of lock.items ?? []) {
    const reg = registry.ok ? registry.items.get(entry.name) : null;
    if (registry.ok && !reg) {
      notes.push(note("missing", "orphaned", `${entry.name} is installed but not in the registry.`));
      problems += 1;
    } else if (reg) {
      const lifecycle = lifecycleOf(reg);
      if (lifecycle.sourceHash !== entry.sourceHash) {
        notes.push(note("drift", "provenance", `${entry.name} sourceHash differs from the registry.`));
        problems += 1;
      }
      if (lifecycle.schemaVersion !== entry.itemSchemaVersion) {
        notes.push(note("migration", "schema", `${entry.name} can migrate to ${lifecycle.schemaVersion}.`));
      } else if (lifecycle.version !== entry.version) {
        notes.push(note("migration", "version", `${entry.name} can update to ${lifecycle.version}.`));
      }
    }
    for (const file of entry.files ?? []) {
      const onDisk = project.readInstalledFile(file.target);
      if (onDisk === null) {
        notes.push(note("missing", "file", `${entry.name}: installed file missing on disk: ${file.target}.`));
        problems += 1;
      } else if (sha256(onDisk) !== file.hash) {
        notes.push(note("drift", "file", `${entry.name}: ${file.target} was modified after install.`));
        problems += 1;
      }
    }
    if (entry.sourceState === "source-pending") {
      notes.push(note("pending", "source-pending", `${entry.name} is descriptor-only; component source is pending.`));
    }
    if (entry.pinned) notes.push(note("pinned", "pinned", `${entry.name} is pinned at ${entry.pinnedVersion ?? entry.version}.`));
  }

  return result("doctor", problems ? "problems" : "healthy", `${problems} problem(s)`, {
    ok: problems === 0,
    data: { problems, checks: notes.length },
    notes,
  });
}

// --- provenance --------------------------------------------------------------

export function provenance(project, registry, name) {
  if (!registry.ok) return result("provenance", "registry-unavailable", registry.reason, { ok: false });
  const item = registry.items.get(shortName(name));
  if (!item) {
    return result("provenance", "missing", `No registry item named ${shortName(name)}`, { ok: false });
  }
  const lifecycle = lifecycleOf(item);
  const files = (item.files ?? []).map((file) => {
    if (!fileHasContent(file)) return { target: file.target, state: "source-pending" };
    const actual = sha256(file.content);
    const registryOk = !file.hash || file.hash === actual;
    const lock = project.readLock();
    const entry = project.lockItem(lock, shortName(name));
    const recorded = (entry?.files ?? []).find((f) => f.target === file.target)?.hash ?? null;
    const onDisk = project.readInstalledFile(file.target);
    return {
      target: file.target,
      state: registryOk ? "verified" : "registry-mismatch",
      registryHash: file.hash ?? actual,
      installedHash: recorded,
      onDiskMatches: onDisk === null ? null : sha256(onDisk) === actual,
    };
  });
  const notes = [];
  if (item.meta?.compatibility?.shadcn?.includes("source-lock required")) {
    notes.push(note("pending", "source-lock", "shadcn/Tailwind source-lock is still required before public generated-source claims."));
  }
  if (provenanceOf(item).copiedSource) {
    notes.push(note("warn", "copied-source", "Item declares copied source; verify upstream license and attribution."));
  }
  return result("provenance", "ok", `Provenance for ${shortName(name)}`, {
    data: {
      name: shortName(item.name),
      lifecycle,
      provenance: provenanceOf(item),
      compatibility: item.meta?.compatibility ?? {},
      files,
    },
    notes,
  });
}

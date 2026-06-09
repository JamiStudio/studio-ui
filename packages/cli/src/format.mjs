// Dense operational formatting for command results.
//
// The CLI favors compact, scannable operational output: a header line with the
// command, status, and summary, then one tagged line per note. Tags are ASCII
// so they render the same across terminals.

const LEVEL_TAG = {
  ok: "[ ok ]",
  warn: "[warn]",
  drift: "[drift]",
  missing: "[miss]",
  blocked: "[blkd]",
  pending: "[pend]",
  migration: "[migr]",
  pinned: "[ pin]",
  rollback: "[undo]",
};

export function formatResult(result) {
  const lines = [];
  const verdict = result.ok ? "ok" : "fail";
  lines.push(`studio-ui ${result.command}: ${result.status} (${verdict}) — ${result.summary}`);
  for (const n of result.notes ?? []) {
    const tag = LEVEL_TAG[n.level] ?? `[${n.level}]`;
    lines.push(`  ${tag} ${n.message}`);
  }
  return lines;
}

// Compact tables for list/inspect data so the operational surfaces are readable
// without a JSON dump.
export function formatList(result) {
  const lines = formatResult(result);
  for (const item of result.data?.items ?? []) {
    const pending = item.sourceState === "installable" ? "" : `  <${item.sourceState}>`;
    lines.push(`  - ${item.name}  ${item.type}  ${item.version ?? "-"}  [${item.suite ?? "no-suite"}]${pending}`);
  }
  return lines;
}

export function formatInspect(result) {
  const lines = formatResult(result);
  const d = result.data ?? {};
  if (d.lifecycle) {
    lines.push(`  id: ${d.lifecycle.id}  version: ${d.lifecycle.version}  schema: ${d.lifecycle.schemaVersion}`);
    lines.push(`  sourceHash: ${d.lifecycle.sourceHash}`);
  }
  if (d.graph) lines.push(`  graph: ${d.graph.join(" -> ")}`);
  for (const f of d.files ?? []) {
    lines.push(`  file: ${f.target}  ${f.hasContent ? "content" : "source-pending"}`);
  }
  if (d.plannedSurfaces) lines.push(`  planned surfaces (pending): ${d.plannedSurfaces.join(", ")}`);
  return lines;
}

export function formatProvenance(result) {
  const lines = formatResult(result);
  for (const f of result.data?.files ?? []) {
    if (f.state === "source-pending") {
      lines.push(`  file: ${f.target}  source-pending`);
    } else {
      const disk = f.onDiskMatches === null ? "not-installed" : f.onDiskMatches ? "matches" : "MODIFIED";
      lines.push(`  file: ${f.target}  ${f.state}  on-disk: ${disk}`);
    }
  }
  return lines;
}

export const STORAGE_KEY = "jami-studio.workbench.overlay.v1";
export const ARTIFACT_VERSION = "2026-06-09.workbench-local";

export const factoryDraft = Object.freeze({
  target: "suite.solo",
  themeName: "Jami factory",
  presetName: "factory",
  controls: Object.freeze({
    accent: "var(--jami-semantic-light-accent)",
    focusRing: "var(--jami-componentState-focusRing)",
    radius: "8",
    spacing: "8",
    density: "1",
    motion: "120",
    dockWidth: "320",
    fontSize: "16",
  }),
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDraft(input) {
  const draft = input && typeof input === "object" ? input : {};
  return {
    ...clone(factoryDraft),
    ...draft,
    controls: {
      ...factoryDraft.controls,
      ...(draft.controls && typeof draft.controls === "object" ? draft.controls : {}),
    },
  };
}

export function createInitialWorkbenchState(seed = {}) {
  const saved = normalizeDraft(seed.saved ?? factoryDraft);
  const draft = normalizeDraft(seed.draft ?? saved);
  return {
    overlayOpen: seed.overlayOpen !== false,
    saved,
    draft,
    duplicateCount: Number.isInteger(seed.duplicateCount) ? seed.duplicateCount : 0,
    registeredArtifacts: Array.isArray(seed.registeredArtifacts) ? clone(seed.registeredArtifacts) : [],
    exportArtifact: seed.exportArtifact ?? null,
    lastAction: seed.lastAction ?? "ready",
  };
}

export function isDirty(state) {
  return JSON.stringify(normalizeDraft(state.draft)) !== JSON.stringify(normalizeDraft(state.saved));
}

export function makeWorkbenchArtifact(state, action) {
  const draft = normalizeDraft(state.draft);
  return {
    schemaVersion: ARTIFACT_VERSION,
    action,
    target: draft.target,
    themeName: draft.themeName,
    presetName: draft.presetName,
    dirty: isDirty(state),
    controls: draft.controls,
    backendPersistence: false,
    localOnly: true,
    createdAt: "static-runtime-local-state",
  };
}

export function reduceWorkbenchState(state, event) {
  const current = createInitialWorkbenchState(state);
  switch (event.type) {
    case "open":
      return { ...current, overlayOpen: true, lastAction: "opened" };
    case "close":
      return { ...current, overlayOpen: false, lastAction: "closed" };
    case "update-control":
      return {
        ...current,
        draft: {
          ...current.draft,
          controls: { ...current.draft.controls, [event.name]: String(event.value ?? "") },
        },
        lastAction: "edited",
      };
    case "select-theme":
      return {
        ...current,
        draft: {
          ...current.draft,
          presetName: event.presetName,
          themeName: event.themeName ?? current.draft.themeName,
        },
        lastAction: "edited",
      };
    case "select-brand-option":
      return {
        ...current,
        draft: {
          ...current.draft,
          presetName: event.presetName,
          themeName: event.themeName ?? current.draft.themeName,
          controls: {
            ...current.draft.controls,
            ...(event.controls && typeof event.controls === "object" ? event.controls : {}),
          },
        },
        lastAction: "selected-brand-option",
      };
    case "save":
      return {
        ...current,
        saved: normalizeDraft(current.draft),
        lastAction: "saved-local",
      };
    case "duplicate": {
      const duplicateCount = current.duplicateCount + 1;
      return {
        ...current,
        duplicateCount,
        draft: {
          ...normalizeDraft(current.draft),
          themeName: `${current.draft.themeName} copy ${duplicateCount}`,
          presetName: `${current.draft.presetName}-copy-${duplicateCount}`,
        },
        lastAction: "duplicated-local",
      };
    }
    case "restore":
      return {
        ...current,
        draft: normalizeDraft(factoryDraft),
        lastAction: "restored-factory",
      };
    case "register": {
      const artifact = makeWorkbenchArtifact(current, "register");
      return {
        ...current,
        registeredArtifacts: [artifact, ...current.registeredArtifacts].slice(0, 5),
        lastAction: "registered-local-artifact",
      };
    }
    case "export": {
      const artifact = makeWorkbenchArtifact(current, "export");
      return { ...current, exportArtifact: artifact, lastAction: "exported-local-artifact" };
    }
    default:
      return current;
  }
}

export function serializeWorkbenchState(state) {
  return JSON.stringify(createInitialWorkbenchState(state));
}

export function parseWorkbenchState(raw) {
  if (!raw) return createInitialWorkbenchState();
  try {
    return createInitialWorkbenchState(JSON.parse(raw));
  } catch {
    return createInitialWorkbenchState();
  }
}

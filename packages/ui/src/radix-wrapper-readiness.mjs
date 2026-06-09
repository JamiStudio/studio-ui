import { componentVocabulary } from "./vocabulary.mjs";

export const RADIX_WRAPPER_READINESS_VERSION = "2026-06-09.radix-wrapper-readiness";

export const radixWrapperOfficialSources = Object.freeze([
  Object.freeze({
    id: "radix-primitives-introduction",
    url: "https://www.radix-ui.com/primitives/docs",
    checkedAt: "2026-06-09",
    posture:
      "Radix is a low-level, accessible, unstyled primitive layer that can be adopted incrementally.",
  }),
  Object.freeze({
    id: "radix-primitives-composition",
    url: "https://www.radix-ui.com/primitives/docs/guides/composition",
    checkedAt: "2026-06-09",
    posture:
      "Radix composition relies on asChild, prop spreading, and ref forwarding; Studio UI wrappers must preserve accessible element behavior.",
  }),
  Object.freeze({
    id: "radix-primitives-styling",
    url: "https://www.radix-ui.com/primitives/docs/guides/styling",
    checkedAt: "2026-06-09",
    posture:
      "Radix primitives are unstyled and expose className/data attributes; Studio UI tokenized styles remain source-owned.",
  }),
  Object.freeze({
    id: "shadcn-registry-introduction",
    url: "https://ui.shadcn.com/docs/registry",
    checkedAt: "2026-06-09",
    posture:
      "The shadcn registry is an install-time code distribution system and is not limited to React projects.",
  }),
  Object.freeze({
    id: "shadcn-registry-item",
    url: "https://ui.shadcn.com/docs/registry/registry-item-json",
    checkedAt: "2026-06-09",
    posture:
      "Registry items declare npm dependencies, registry dependencies, docs, and install files explicitly.",
  }),
]);

export const radixWrapperBoundary = Object.freeze({
  schemaVersion: RADIX_WRAPPER_READINESS_VERSION,
  implementationStatus: "readiness-contract-only",
  radixDependencyDeclared: false,
  reactDependencyDeclared: false,
  copiedRadixSource: false,
  copiedShadcnSource: false,
  runtimeReactRenderer: false,
  rendererPayloadCanImportPackages: false,
  rendererPayloadCanAttachHandlers: false,
  hostedRuntime: false,
  backendPersistence: false,
  backendRegistration: false,
});

const readinessEvidenceLabels = Object.freeze({
  officialSourceLock: "repo-local official Radix and shadcn source-lock record",
  dependencyDeclared: "pinned React and Radix dependency declarations with lockfile resolution",
  wrapperSourceFile: "source-owned React wrapper files under packages/ui",
  propSchemaParityTest: "prop schema parity with the resident vocabulary",
  tokenizedStyleTest: "tokenized className/data-state styling with no component color literals",
  browserA11yVisualSmoke: "browser keyboard focus accessibility visual smoke for wrapper examples",
  registryInstallContent: "registry item install content and content hash for wrapper files",
  rendererNonExecutionFixture: "negative renderer fixture proving wrappers are not runtime payload execution",
});

export const requiredRadixWrapperEvidence = Object.freeze(Object.values(readinessEvidenceLabels));

const wrapperPlans = Object.freeze({
  button: Object.freeze({
    plannedExport: "JamiButton",
    wrapperStrategy: "Radix Slot-compatible leaf wrapper",
  }),
  panel: Object.freeze({
    plannedExport: "JamiPanel",
    wrapperStrategy: "React region wrapper with Radix composition compatibility",
  }),
  "text-field": Object.freeze({
    plannedExport: "JamiTextField",
    wrapperStrategy: "React labelled control wrapper with Radix composition compatibility",
  }),
  "data-list": Object.freeze({
    plannedExport: "JamiDataList",
    wrapperStrategy: "React display component; no runtime data execution",
  }),
  "agent-panel": Object.freeze({
    plannedExport: "JamiAgentPanel",
    wrapperStrategy: "React display-only action/artifact reference component",
  }),
  "docs-source-panel": Object.freeze({
    plannedExport: "JamiDocsSourcePanel",
    wrapperStrategy: "React display-only source and citation component",
  }),
  "media-grid": Object.freeze({
    plannedExport: "JamiMediaGrid",
    wrapperStrategy: "React display-only artifact gallery component",
  }),
});

function readinessRecord(definition) {
  const plan = wrapperPlans[definition.name];
  const readiness = Object.freeze({
    officialSourceLock: true,
    dependencyDeclared: false,
    wrapperSourceFile: false,
    propSchemaParityTest: false,
    tokenizedStyleTest: false,
    browserA11yVisualSmoke: false,
    registryInstallContent: false,
    rendererNonExecutionFixture: false,
  });
  return Object.freeze({
    schemaVersion: RADIX_WRAPPER_READINESS_VERSION,
    component: definition.name,
    registryItem: definition.registryItem,
    namespace: definition.namespace,
    currentImplementation: "framework-neutral-component-factory",
    plannedExport: plan.plannedExport,
    wrapperStrategy: plan.wrapperStrategy,
    claimStatus: "do-not-claim",
    missingEvidence: Object.freeze(
      Object.entries(readiness)
        .filter(([, value]) => value !== true)
        .map(([key]) => readinessEvidenceLabels[key]),
    ),
    readiness,
    boundary: Object.freeze({
      radixWrapper: false,
      runtimeReactRenderer: false,
      rendererPayloadExecution: false,
      executableActions: false,
      copiedSource: false,
      hostedRuntime: false,
      backendPersistence: false,
      backendRegistration: false,
    }),
  });
}

export const radixWrapperReadiness = Object.freeze(
  Object.fromEntries(componentVocabulary.map((definition) => [definition.name, readinessRecord(definition)])),
);

export function getRadixWrapperReadiness(name) {
  return radixWrapperReadiness[name] ?? null;
}

export function getRadixWrapperGaps() {
  return Object.values(radixWrapperReadiness).flatMap((record) =>
    Object.entries(record.readiness)
      .filter(([, value]) => value !== true)
      .map(([key]) => `${record.component}:${key}`),
  );
}

export function canClaimRadixWrappers() {
  return getRadixWrapperGaps().length === 0;
}

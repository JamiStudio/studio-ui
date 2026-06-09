export const RADIX_REACT_WRAPPER_VERSION = "2026-06-09.radix-react-wrapper-slice";

export const implementedRadixReactWrapperNames = Object.freeze(["button", "panel", "text-field"]);

export const radixReactWrapperPackageEvidence = Object.freeze({
  react: Object.freeze({
    package: "react",
    version: "19.2.7",
    license: "MIT",
    repository: "git+https://github.com/facebook/react.git",
    npmIntegrity:
      "sha512-HNe9WslTbXmFK8o8cmwgAeJFSBvt1bPdHCVKtaaV+WlAN36mpT4hcRpwbf3fY56ar2oIXzsBpOAiIRHAdY0OlQ==",
    peerRange: ">=19 <20",
  }),
  reactDom: Object.freeze({
    package: "react-dom",
    version: "19.2.7",
    license: "MIT",
    repository: "git+https://github.com/facebook/react.git",
    npmIntegrity:
      "sha512-t0BRVXvbiE/o20Hfw669rLbMCDWtYZLvmJigy2f0MxsXF+71pxhR3xOkspmsO8h3ZlNzyibAmtCa3l4lYKk6gQ==",
    usage: "dev/test server-render evidence only",
  }),
  radixSlot: Object.freeze({
    package: "@radix-ui/react-slot",
    version: "1.2.5",
    license: "MIT",
    repository: "git+https://github.com/radix-ui/primitives.git",
    npmIntegrity:
      "sha512-rCMO3QsIVKv5JTY5CVbo2MvO77SpEqqYc8AvRE7OWqRDOIqAKjsp+DrmnY9uc8NPdxB5E2z47HTYGeE2+NTptg==",
  }),
  radixLabel: Object.freeze({
    package: "@radix-ui/react-label",
    version: "2.1.9",
    license: "MIT",
    repository: "git+https://github.com/radix-ui/primitives.git",
    npmIntegrity:
      "sha512-rDoTeMbCwRVcnmo7NGT9IlPo1yXmEI+xc1URP3oeewwZEV4mdTp1dYUhYbQdo4D1q2SjKVvv4N1gNY77QAQtjA==",
  }),
});

function wrapperEvidence({
  component,
  exportName,
  source,
  radixPackages,
  wrapperRole,
  registryItem,
}) {
  return Object.freeze({
    schemaVersion: RADIX_REACT_WRAPPER_VERSION,
    component,
    registryItem,
    namespace: "@jami-studio/ui",
    exportName,
    implementationStatus: "implemented-radix-react-wrapper-slice",
    source,
    wrapperRole,
    radixPackages: Object.freeze(radixPackages),
    reactPeerRange: radixReactWrapperPackageEvidence.react.peerRange,
    copiedSource: false,
    tokenizedStyles: Object.freeze(["packages/ui/src/styles.css", "jami-* classes", "--jami-* variables"]),
    propSchemaParity: true,
    registryInstallContent: true,
    rendererPayloadExecution: false,
    runtimeReactRenderer: false,
    hostedRuntime: false,
    backendPersistence: false,
    backendRegistration: false,
    evidenceCommands: Object.freeze([
      "pnpm --filter @jami-studio/ui test",
      "pnpm contracts:check",
      "pnpm --filter @jami-studio/workbench test",
      "pnpm --filter @jami-studio/workbench smoke",
    ]),
  });
}

export const radixReactWrapperEvidence = Object.freeze({
  button: wrapperEvidence({
    component: "button",
    registryItem: "@jami-studio/button",
    exportName: "JamiButton",
    source: "packages/ui/src/radix-react-wrappers.mjs",
    radixPackages: ["@radix-ui/react-slot@1.2.5"],
    wrapperRole: "Radix Slot-compatible asChild action primitive",
  }),
  panel: wrapperEvidence({
    component: "panel",
    registryItem: "@jami-studio/panel",
    exportName: "JamiPanel",
    source: "packages/ui/src/radix-react-wrappers.mjs",
    radixPackages: [],
    wrapperRole: "React ref-forwarding region primitive aligned to the resident panel schema",
  }),
  "text-field": wrapperEvidence({
    component: "text-field",
    registryItem: "@jami-studio/text-field",
    exportName: "JamiTextField",
    source: "packages/ui/src/radix-react-wrappers.mjs",
    radixPackages: ["@radix-ui/react-label@2.1.9"],
    wrapperRole: "Radix Label-backed labelled text input primitive",
  }),
});

export function getRadixReactWrapperEvidence(name) {
  return radixReactWrapperEvidence[name] ?? null;
}

export function hasRadixReactWrapperEvidence(name) {
  return Boolean(getRadixReactWrapperEvidence(name));
}

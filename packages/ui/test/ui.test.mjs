import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  componentVocabulary,
  createJamiPrimitiveComponents,
  canClaimRadixWrappers,
  getComponentDefinition,
  getPrimitiveDescriptor,
  getPrimitiveComponentImplementation,
  getRadixWrapperGaps,
  getRadixWrapperReadiness,
  primitiveComponentImplementations,
  primitiveComponentNames,
  primitiveDescriptors,
  radixWrapperBoundary,
  radixWrapperOfficialSources,
  radixWrapperReadiness,
  registryAddressableNames,
  renderPrimitiveSpec,
  requiredRadixWrapperEvidence,
  stateFixtureMatrix,
  validateComponentProps,
  vocabularyHandshake,
} from "../src/index.mjs";

const root = fileURLToPath(new URL("../../..", import.meta.url));

const requiredNames = [
  "button",
  "panel",
  "text-field",
  "data-list",
  "agent-panel",
  "docs-source-panel",
  "media-grid",
];

const requiredStates = [
  "keyboard",
  "focus-visible",
  "aria",
  "contrast",
  "reduced-motion",
  "responsive",
  "disabled",
  "loading",
  "invalid",
  "empty",
  "error",
  "long-content",
];

test("resident vocabulary exposes the initial primitive and component inventory", () => {
  assert.deepEqual(registryAddressableNames, requiredNames);
  for (const name of requiredNames) {
    const definition = getComponentDefinition(name);
    assert.ok(definition, `${name} is defined`);
    assert.equal(definition.namespace, "@jami-studio/ui");
    assert.equal(definition.provenance.source, "authored");
    assert.equal(definition.provenance.copiedSource, false);
    assert.equal(definition.registryItem, `@jami-studio/${name}`);
  }
});

test("each component carries the shared accessibility and state fixture matrix", () => {
  for (const definition of componentVocabulary) {
    for (const state of requiredStates) {
      assert.ok(definition.states.includes(state), `${definition.name} covers ${state}`);
      assert.ok(stateFixtureMatrix[definition.name].includes(state), `${definition.name} matrix covers ${state}`);
    }
    assert.ok(definition.aria.role, `${definition.name} carries an ARIA role`);
    assert.ok(definition.aria.labelSource, `${definition.name} declares a label source`);
    assert.equal(definition.propSchema.schemaVersion, vocabularyHandshake.propSchemaVersion);
    assert.equal(definition.propSchema.additionalProperties, false);
    assert.ok(Object.keys(definition.propSchema.properties).length > 0, `${definition.name} declares prop schema metadata`);
  }
});

test("component prop schemas validate allowed props and reject unsafe shape drift", () => {
  assert.deepEqual(validateComponentProps("button", { variant: "primary", actionRef: "act_save" }), []);
  assert.deepEqual(validateComponentProps("text-field", { label: "Search", invalid: false }), []);
  assert.deepEqual(validateComponentProps("button", { href: "/not-supported" }), [
    "unsupported prop href for button",
  ]);
  assert.deepEqual(validateComponentProps("button", { variant: "loud" }), [
    "prop variant must be one of primary, secondary, ghost, danger",
  ]);
  assert.deepEqual(validateComponentProps("text-field", { invalid: "yes" }), [
    "missing required prop label",
    "prop invalid must be boolean",
  ]);
});

test("vocabulary handshake pins renderer payload and prop schema versions", () => {
  assert.equal(vocabularyHandshake.componentNamespace, "@jami-studio/ui");
  assert.equal(vocabularyHandshake.componentVersion, "0.0.0");
  assert.ok(vocabularyHandshake.payloadSchemaVersions.includes("2026-06-09"));
  assert.equal(vocabularyHandshake.propSchemaVersion, "2026-06-09.ui-props");
  assert.equal(vocabularyHandshake.generation.unsupportedComponentState, "unsupported");
  assert.equal(vocabularyHandshake.generation.invalidPropState, "invalid");
  assert.equal(vocabularyHandshake.generation.copiedSource, false);
});

test("react-style primitive descriptors are source-backed by component factories", () => {
  assert.deepEqual(Object.keys(primitiveDescriptors), requiredNames);
  for (const name of requiredNames) {
    const descriptor = getPrimitiveDescriptor(name);
    assert.ok(descriptor, `${name} descriptor exists`);
    assert.equal(descriptor.implementationStatus, "framework-neutral-component-factory");
    assert.equal(descriptor.implementationSource, "packages/ui/src/primitive-components.mjs");
    assert.equal(descriptor.radixWrapper, false);
    assert.equal(descriptor.runtimeReactRenderer, false);
    assert.equal(descriptor.vocabularyHandshake, vocabularyHandshake.schemaVersion);
    assert.equal(descriptor.provenance.copiedSource, false);
    assert.equal(descriptor.propSchema, getComponentDefinition(name).propSchema);
  }
});

function collectProps(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (node.props) out.push(node.props);
  for (const child of node.children ?? []) collectProps(child, out);
  return out;
}

function collectExecutable(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectExecutable(item, out);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/^on[a-z]/i.test(key) || key === "dangerouslySetInnerHTML") out.push(key);
      if ((key === "executable" || key === "canExecute") && item === true) out.push(key);
      collectExecutable(item, out);
    }
  }
  return out;
}

const sampleProps = {
  button: { label: "Save", variant: "primary", actionRef: "act_save" },
  panel: { title: "Operations", children: ["Dense operational state"] },
  "text-field": { label: "Search", helperText: "Find records" },
  "data-list": {
    title: "Tasks",
    columns: [{ key: "name", label: "Name" }],
    rows: [{ name: "Review evidence" }],
  },
  "agent-panel": {
    title: "Review agent",
    status: "running",
    actionRefs: ["act_review"],
    artifactViewRefs: ["artv_trace"],
  },
  "docs-source-panel": {
    title: "Sources",
    sources: [{ id: "src_1", title: "Foundation alignment" }],
  },
  "media-grid": {
    title: "Assets",
    items: [{ id: "art_1", title: "Frame 01" }],
  },
};

test("primitive component factories render importable non-executable DOM specs", () => {
  assert.deepEqual(primitiveComponentNames, requiredNames);
  assert.deepEqual(Object.keys(primitiveComponentImplementations), requiredNames);
  for (const name of requiredNames) {
    const implementation = getPrimitiveComponentImplementation(name);
    assert.equal(implementation.implementationStatus, "framework-neutral-component-factory");
    assert.equal(implementation.radixWrapper, false);
    assert.equal(implementation.runtimeReactRenderer, false);
    assert.equal(implementation.executableActions, false);
    assert.equal(implementation.vocabularyHandshake, vocabularyHandshake.schemaVersion);

    const result = renderPrimitiveSpec(name, sampleProps[name]);
    assert.equal(result.state, "renderable", `${name} renders`);
    assert.deepEqual(result.reasons, []);
    assert.deepEqual(JSON.parse(JSON.stringify(result.node)), result.node, `${name} render spec is JSON-inert`);
    assert.deepEqual(collectExecutable(result.node), [], `${name} does not expose executable props`);
    assert.ok(
      collectProps(result.node).some((props) => typeof props.className === "string" && props.className.startsWith("jami-")),
      `${name} uses tokenized jami classes`,
    );
  }
});

test("primitive component factories fail closed on unsupported or invalid props", () => {
  const unknown = renderPrimitiveSpec("calendar-board", {});
  assert.equal(unknown.state, "unsupported");
  const invalid = renderPrimitiveSpec("button", { href: "/unsafe" });
  assert.equal(invalid.state, "invalid");
  assert.deepEqual(invalid.reasons, ["unsupported prop href for button"]);
  assert.deepEqual(collectExecutable(invalid.node), [], "invalid fallback stays non-executable");
});

test("createJamiPrimitiveComponents adapts factories to an injected createElement", () => {
  const createElement = (type, props, ...children) => ({ type, props, children });
  const components = createJamiPrimitiveComponents(createElement);
  assert.deepEqual(Object.keys(components), [
    "Button",
    "Panel",
    "TextField",
    "DataList",
    "AgentPanel",
    "DocsSourcePanel",
    "MediaGrid",
  ]);
  const button = components.Button({ label: "Save", actionRef: "act_save", children: "Save now" });
  assert.equal(button.type, "button");
  assert.equal(button.props.className, "jami-button");
  assert.equal(button.props["data-action-ref"], "act_save");
  assert.deepEqual(button.children, ["Save now"]);
  assert.deepEqual(collectExecutable(button), [], "createElement adapter does not attach executable props");

  assert.throws(() => createJamiPrimitiveComponents(null), /requires a createElement function/);
});

test("Radix wrapper readiness is source-locked but not claimed as implemented", () => {
  assert.deepEqual(Object.keys(radixWrapperReadiness), requiredNames);
  assert.equal(radixWrapperBoundary.implementationStatus, "readiness-contract-only");
  assert.equal(radixWrapperBoundary.radixDependencyDeclared, false);
  assert.equal(radixWrapperBoundary.reactDependencyDeclared, false);
  assert.equal(radixWrapperBoundary.runtimeReactRenderer, false);
  assert.equal(radixWrapperBoundary.backendPersistence, false);
  assert.equal(radixWrapperBoundary.backendRegistration, false);

  for (const source of radixWrapperOfficialSources) {
    assert.equal(source.checkedAt, "2026-06-09");
    assert.match(source.url, /^https:\/\/(www\.radix-ui\.com|ui\.shadcn\.com)\//);
  }
  assert.ok(
    requiredRadixWrapperEvidence.includes("negative renderer fixture proving wrappers are not runtime payload execution"),
  );

  for (const name of requiredNames) {
    const readiness = getRadixWrapperReadiness(name);
    const implementation = getPrimitiveComponentImplementation(name);
    assert.ok(readiness, `${name} has wrapper readiness`);
    assert.equal(readiness.registryItem, `@jami-studio/${name}`);
    assert.equal(readiness.currentImplementation, implementation.implementationStatus);
    assert.equal(readiness.claimStatus, "do-not-claim");
    assert.equal(readiness.readiness.officialSourceLock, true);
    assert.equal(
      readiness.missingEvidence.includes("repo-local official Radix and shadcn source-lock record"),
      false,
    );
    assert.ok(
      readiness.missingEvidence.includes("pinned React and Radix dependency declarations with lockfile resolution"),
    );
    assert.equal(
      readiness.missingEvidence.length,
      Object.values(readiness.readiness).filter((value) => value !== true).length,
    );
    assert.equal(readiness.readiness.dependencyDeclared, false);
    assert.equal(readiness.readiness.wrapperSourceFile, false);
    assert.equal(readiness.readiness.browserA11yVisualSmoke, false);
    assert.equal(readiness.boundary.radixWrapper, false);
    assert.equal(readiness.boundary.runtimeReactRenderer, false);
    assert.equal(readiness.boundary.rendererPayloadExecution, false);
    assert.equal(readiness.boundary.executableActions, false);
    assert.equal(readiness.boundary.hostedRuntime, false);
    assert.equal(readiness.boundary.backendPersistence, false);
    assert.equal(readiness.boundary.backendRegistration, false);
  }

  assert.equal(canClaimRadixWrappers(), false);
  assert.ok(getRadixWrapperGaps().includes("button:dependencyDeclared"));
  assert.ok(getRadixWrapperGaps().includes("button:rendererNonExecutionFixture"));
});

test("primitive component factories keep caller children inert", () => {
  const unsafeChild = {
    type: "script",
    props: {
      onClick: "run",
      dangerouslySetInnerHTML: { __html: "<script>run()</script>" },
    },
    children: [],
  };
  const circular = {};
  circular.self = circular;
  const circularChildren = ["Nested child"];
  circularChildren.push(circularChildren);

  const spec = renderPrimitiveSpec("panel", {
    title: "Evidence",
    children: [unsafeChild, circular, circularChildren],
  });
  assert.equal(spec.state, "renderable");
  assert.deepEqual(collectExecutable(spec.node), [], "raw spec does not expose executable child props");
  assert.equal(
    spec.node.children.some((child) => child && typeof child === "object" && child.type === "script"),
    false,
    "caller-supplied spec-shaped children are not adapted as elements",
  );
  assert.ok(
    spec.node.children.includes("[unserializable value]"),
    "unserializable child data is represented by an inert marker",
  );
  assert.ok(spec.node.children.includes("Nested child"), "nested child arrays are flattened as display data");
  assert.equal(
    spec.node.children.filter((child) => child === "[unserializable value]").length,
    2,
    "cyclic child arrays are represented by an inert marker",
  );

  const createElement = (type, props, ...children) => ({ type, props, children });
  const components = createJamiPrimitiveComponents(createElement);
  const panel = components.Panel({ title: "Evidence", children: [unsafeChild, circularChildren] });
  assert.deepEqual(collectExecutable(panel), [], "adapter output does not expose executable child props");
  assert.equal(
    panel.children.some((child) => child && typeof child === "object" && child.type === "script"),
    false,
    "createElement adapter does not receive caller-supplied child elements",
  );
  assert.equal(typeof panel.children.at(-1), "string", "caller child is display data only");
});

test("component token references stay inside the generated Studio UI token set", () => {
  const generated = readFileSync(join(root, "packages/tokens/generated/jami-tokens.ts"), "utf8");
  for (const definition of componentVocabulary) {
    for (const token of definition.tokens) {
      assert.match(generated, new RegExp(`"${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${token} exists`);
    }
  }
});

test("component styles use token variables instead of hardcoded component colors", () => {
  const css = readFileSync(join(root, "packages/ui/src/styles.css"), "utf8");
  const declarations = css
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(background|background-color|border|border-color|box-shadow|color|outline):/.test(line));

  assert.ok(declarations.length > 0, "style guard saw component color declarations");
  for (const declaration of declarations) {
    assert.match(declaration, /var\(--jami-/, `${declaration} uses generated token variables`);
    assert.doesNotMatch(declaration, /#[0-9a-fA-F]{3,8}|rgb\(|rgba\(/, `${declaration} has no hardcoded color literal`);
  }
});

test("registry fixtures exist for every resident vocabulary item", () => {
  const files = new Set(readdirSync(join(root, "packages/registry/fixtures/valid")));
  for (const name of requiredNames) {
    assert.ok(files.has(`${name}.registry-item.json`), `${name} registry item exists`);
  }
});

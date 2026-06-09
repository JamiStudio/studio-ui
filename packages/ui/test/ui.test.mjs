import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  componentVocabulary,
  getComponentDefinition,
  getPrimitiveDescriptor,
  primitiveDescriptors,
  registryAddressableNames,
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

test("react-style primitive descriptors are source-backed and descriptor-only", () => {
  assert.deepEqual(Object.keys(primitiveDescriptors), requiredNames);
  for (const name of requiredNames) {
    const descriptor = getPrimitiveDescriptor(name);
    assert.ok(descriptor, `${name} descriptor exists`);
    assert.equal(descriptor.implementationStatus, "descriptor-only");
    assert.equal(descriptor.vocabularyHandshake, vocabularyHandshake.schemaVersion);
    assert.equal(descriptor.provenance.copiedSource, false);
    assert.equal(descriptor.propSchema, getComponentDefinition(name).propSchema);
  }
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

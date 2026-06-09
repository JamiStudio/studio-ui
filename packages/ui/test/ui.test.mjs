import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  componentVocabulary,
  getComponentDefinition,
  registryAddressableNames,
  stateFixtureMatrix,
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
    assert.ok(Object.keys(definition.propSchema).length > 0, `${definition.name} declares prop schema metadata`);
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

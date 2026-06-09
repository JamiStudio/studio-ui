import { componentVocabulary, vocabularyHandshake } from "./vocabulary.mjs";

function descriptor(definition, element, slots = []) {
  return Object.freeze({
    schemaVersion: "2026-06-09.primitive-descriptor",
    component: definition.name,
    registryItem: definition.registryItem,
    namespace: definition.namespace,
    vocabularyHandshake: vocabularyHandshake.schemaVersion,
    sourceKind: "react-style-descriptor",
    implementationStatus: "framework-neutral-component-factory",
    implementationSource: "packages/ui/src/primitive-components.mjs",
    radixWrapper: false,
    runtimeReactRenderer: false,
    element,
    slots: Object.freeze(slots),
    propSchemaVersion: definition.propSchema.schemaVersion,
    propSchema: definition.propSchema,
    a11y: definition.aria,
    provenance: definition.provenance,
  });
}

const definitions = new Map(componentVocabulary.map((definition) => [definition.name, definition]));

export const primitiveDescriptors = Object.freeze({
  button: descriptor(definitions.get("button"), "button", ["children", "actionRef"]),
  panel: descriptor(definitions.get("panel"), "section", ["title", "children"]),
  "text-field": descriptor(definitions.get("text-field"), "input", ["label", "helperText", "errorText"]),
  "data-list": descriptor(definitions.get("data-list"), "table | ul", ["columns", "rows", "empty"]),
  "agent-panel": descriptor(definitions.get("agent-panel"), "section", ["status", "actionRefs", "artifactViewRefs"]),
  "docs-source-panel": descriptor(definitions.get("docs-source-panel"), "aside", ["sources", "selectedSourceId"]),
  "media-grid": descriptor(definitions.get("media-grid"), "ul", ["items", "selectedItemId"]),
});

export function getPrimitiveDescriptor(name) {
  return primitiveDescriptors[name] ?? null;
}

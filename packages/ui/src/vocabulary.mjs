export const UI_VOCABULARY_SCHEMA_VERSION = "2026-06-09.ui-vocabulary";
export const UI_PROP_SCHEMA_VERSION = "2026-06-09.ui-props";
export const UI_VOCABULARY_HANDSHAKE_VERSION = "2026-06-09.vocabulary-handshake";
export const UI_PAYLOAD_SCHEMA_VERSION = "2026-06-09";

export const vocabularyHandshake = Object.freeze({
  schemaVersion: UI_VOCABULARY_HANDSHAKE_VERSION,
  payloadSchemaVersions: Object.freeze([UI_PAYLOAD_SCHEMA_VERSION]),
  componentNamespace: "@jami-studio/ui",
  componentVersion: "0.0.0",
  propSchemaVersion: UI_PROP_SCHEMA_VERSION,
  vocabularyVersion: UI_VOCABULARY_SCHEMA_VERSION,
  generation: Object.freeze({
    source: "registry-addressable-resident-vocabulary",
    unsupportedComponentState: "unsupported",
    invalidPropState: "invalid",
    actions: "display-only actionRefs; execution stays in Jami Harness",
    copiedSource: false,
  }),
});

const baseStates = [
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

function defineComponent(definition) {
  return Object.freeze({
    schemaVersion: UI_VOCABULARY_SCHEMA_VERSION,
    namespace: "@jami-studio/ui",
    provenance: {
      source: "authored",
      license: "MIT",
      reviewedAt: "2026-06-09",
      copiedSource: false,
    },
    ...definition,
    tokens: Object.freeze(definition.tokens),
    states: Object.freeze(definition.states),
    propSchema: deepFreeze({
      schemaVersion: UI_PROP_SCHEMA_VERSION,
      additionalProperties: false,
      required: [],
      ...definition.propSchema,
    }),
  });
}

function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}

function stringProp({ enumValues, pattern, nullable = false } = {}) {
  return {
    type: "string",
    ...(enumValues ? { enum: enumValues } : {}),
    ...(pattern ? { pattern } : {}),
    ...(nullable ? { nullable: true } : {}),
  };
}

function booleanProp() {
  return { type: "boolean" };
}

function arrayProp({ itemType = "object", pattern } = {}) {
  return { type: "array", items: { type: itemType, ...(pattern ? { pattern } : {}) } };
}

const actionRefProp = arrayProp({ itemType: "string", pattern: "^act_[a-z0-9][a-z0-9_-]*$" });
const artifactViewRefProp = arrayProp({ itemType: "string", pattern: "^artv_[a-z0-9][a-z0-9_-]*$" });

export const componentVocabulary = Object.freeze([
  defineComponent({
    name: "button",
    kind: "primitive",
    registryItem: "@jami-studio/button",
    description: "Tokenized action surface for command slots and form actions.",
    tokens: [
      "semantic.light.accent",
      "semantic.light.background",
      "semantic.light.foreground",
      "semantic.dark.accent",
      "componentState.focusRing",
      "spacing.control",
      "radius.control",
      "motion.fast",
    ],
    states: baseStates,
    aria: {
      role: "button",
      labelSource: "label | ariaLabel",
      disabledAttribute: "disabled",
      busyAttribute: "aria-busy",
    },
    propSchema: {
      properties: {
        label: stringProp(),
        ariaLabel: stringProp(),
        variant: stringProp({ enumValues: ["primary", "secondary", "ghost", "danger"] }),
        size: stringProp({ enumValues: ["compact", "regular"] }),
        disabled: booleanProp(),
        loading: booleanProp(),
        actionRef: stringProp({ pattern: "^act_[a-z0-9][a-z0-9_-]*$" }),
      },
    },
  }),
  defineComponent({
    name: "panel",
    kind: "primitive",
    registryItem: "@jami-studio/panel",
    description: "Low-radius tokenized surface for cards, docks, and grouped content.",
    tokens: [
      "semantic.light.background",
      "semantic.light.foreground",
      "semantic.dark.background",
      "semantic.dark.foreground",
      "componentState.focusRing",
      "radius.control",
      "shadow.overlay",
    ],
    states: baseStates,
    aria: {
      role: "region",
      labelSource: "title | ariaLabel",
      emptyState: "aria-live=polite",
    },
    propSchema: {
      properties: {
        title: stringProp(),
        ariaLabel: stringProp(),
        tone: stringProp({ enumValues: ["neutral", "accent", "danger"] }),
        empty: booleanProp(),
        error: stringProp(),
      },
    },
  }),
  defineComponent({
    name: "text-field",
    kind: "primitive",
    registryItem: "@jami-studio/text-field",
    description: "Labelled input field with invalid, disabled, loading, and helper states.",
    tokens: [
      "semantic.light.background",
      "semantic.light.foreground",
      "semantic.light.accent",
      "componentState.focusRing",
      "spacing.control",
      "radius.control",
      "motion.fast",
    ],
    states: baseStates,
    aria: {
      role: "textbox",
      labelSource: "label",
      invalidAttribute: "aria-invalid",
      describedBy: "helperText | errorText",
    },
    propSchema: {
      required: ["label"],
      properties: {
        label: stringProp(),
        value: stringProp(),
        placeholder: stringProp(),
        disabled: booleanProp(),
        invalid: booleanProp(),
        errorText: stringProp(),
        helperText: stringProp(),
      },
    },
  }),
  defineComponent({
    name: "data-list",
    kind: "component",
    registryItem: "@jami-studio/data-list",
    description: "Responsive table/list display for dense operational records.",
    tokens: [
      "semantic.light.background",
      "semantic.light.foreground",
      "semantic.dark.background",
      "semantic.dark.foreground",
      "componentState.focusRing",
      "spacing.control",
      "radius.control",
    ],
    states: baseStates,
    aria: {
      role: "table | list",
      labelSource: "title | ariaLabel",
      emptyState: "status",
    },
    propSchema: {
      properties: {
        title: stringProp(),
        ariaLabel: stringProp(),
        columns: arrayProp(),
        rows: arrayProp(),
        empty: booleanProp(),
        loading: booleanProp(),
        error: stringProp(),
      },
    },
  }),
  defineComponent({
    name: "agent-panel",
    kind: "component",
    registryItem: "@jami-studio/agent-panel",
    description: "Display-only agent status, pending approval, denied action, and error panel.",
    tokens: [
      "semantic.light.background",
      "semantic.light.foreground",
      "semantic.light.accent",
      "componentState.focusRing",
      "spacing.control",
      "radius.control",
    ],
    states: baseStates,
    aria: {
      role: "status",
      labelSource: "title | agentName",
      liveRegion: "polite",
    },
    propSchema: {
      properties: {
        title: stringProp(),
        agentName: stringProp(),
        status: stringProp({ enumValues: ["idle", "running", "needs_attention", "denied", "error"] }),
        actionRefs: actionRefProp,
        artifactViewRefs: artifactViewRefProp,
      },
    },
  }),
  defineComponent({
    name: "docs-source-panel",
    kind: "component",
    registryItem: "@jami-studio/docs-source-panel",
    description: "Source, citation, and document reference panel with redaction-aware states.",
    tokens: [
      "semantic.light.background",
      "semantic.light.foreground",
      "semantic.dark.background",
      "semantic.dark.foreground",
      "componentState.focusRing",
      "spacing.control",
      "radius.control",
    ],
    states: baseStates,
    aria: {
      role: "complementary",
      labelSource: "title | ariaLabel",
      redactionState: "aria-describedby",
    },
    propSchema: {
      properties: {
        title: stringProp(),
        ariaLabel: stringProp(),
        sources: arrayProp(),
        selectedSourceId: stringProp(),
        redacted: booleanProp(),
        empty: booleanProp(),
      },
    },
  }),
  defineComponent({
    name: "media-grid",
    kind: "component",
    registryItem: "@jami-studio/media-grid",
    description: "Responsive media and artifact gallery with empty/error/loading states.",
    tokens: [
      "semantic.light.background",
      "semantic.light.foreground",
      "semantic.dark.background",
      "semantic.dark.foreground",
      "componentState.focusRing",
      "spacing.control",
      "radius.control",
      "motion.fast",
    ],
    states: baseStates,
    aria: {
      role: "list",
      labelSource: "title | ariaLabel",
      itemRole: "listitem",
    },
    propSchema: {
      properties: {
        title: stringProp(),
        ariaLabel: stringProp(),
        items: arrayProp(),
        selectedItemId: stringProp(),
        loading: booleanProp(),
        empty: booleanProp(),
        error: stringProp(),
      },
    },
  }),
]);

const byName = new Map(componentVocabulary.map((definition) => [definition.name, definition]));

export const registryAddressableNames = Object.freeze([...byName.keys()]);

export const stateFixtureMatrix = Object.freeze(
  Object.fromEntries(componentVocabulary.map((definition) => [definition.name, definition.states])),
);

export function getComponentDefinition(name) {
  return byName.get(name) ?? null;
}

function valueType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function validateValue(propName, value, rule, issues) {
  const actual = valueType(value);
  if (value === null && rule.nullable) return;
  if (actual !== rule.type) {
    issues.push(`prop ${propName} must be ${rule.type}`);
    return;
  }
  if (rule.enum && !rule.enum.includes(value)) {
    issues.push(`prop ${propName} must be one of ${rule.enum.join(", ")}`);
  }
  if (rule.pattern && typeof value === "string" && !new RegExp(rule.pattern).test(value)) {
    issues.push(`prop ${propName} does not match ${rule.pattern}`);
  }
  if (rule.type === "array" && rule.items) {
    for (const [index, item] of value.entries()) {
      validateValue(`${propName}[${index}]`, item, rule.items, issues);
    }
  }
}

export function validateComponentProps(componentName, props) {
  const definition = getComponentDefinition(componentName);
  if (!definition) return [`component ${componentName} has no prop schema`];
  if (props === undefined) return [];
  if (!props || typeof props !== "object" || Array.isArray(props)) {
    return [`props for ${componentName} must be an object`];
  }
  const schema = definition.propSchema;
  const issues = [];
  const properties = schema.properties ?? {};
  for (const required of schema.required ?? []) {
    if (!Object.hasOwn(props, required)) issues.push(`missing required prop ${required}`);
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(props)) {
      if (!Object.hasOwn(properties, key)) issues.push(`unsupported prop ${key} for ${componentName}`);
    }
  }
  for (const [key, value] of Object.entries(props)) {
    const rule = properties[key];
    if (rule) validateValue(key, value, rule, issues);
  }
  return issues;
}

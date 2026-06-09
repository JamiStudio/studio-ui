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
    schemaVersion: "2026-06-09.ui-vocabulary",
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
    propSchema: Object.freeze(definition.propSchema),
  });
}

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
      label: "string",
      variant: ["primary", "secondary", "ghost", "danger"],
      size: ["compact", "regular"],
      disabled: "boolean",
      loading: "boolean",
      actionRef: "act_* reference only",
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
      title: "string",
      tone: ["neutral", "accent", "danger"],
      empty: "boolean",
      error: "string",
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
      label: "string",
      value: "string",
      placeholder: "string",
      disabled: "boolean",
      invalid: "boolean",
      errorText: "string",
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
      title: "string",
      columns: "array",
      rows: "array",
      empty: "boolean",
      loading: "boolean",
      error: "string",
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
      agentName: "string",
      status: ["idle", "running", "needs_attention", "denied", "error"],
      actionRefs: "act_* reference array",
      artifactViewRefs: "artv_* reference array",
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
      title: "string",
      sources: "array",
      selectedSourceId: "string",
      redacted: "boolean",
      empty: "boolean",
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
      title: "string",
      items: "array",
      selectedItemId: "string",
      loading: "boolean",
      empty: "boolean",
      error: "string",
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

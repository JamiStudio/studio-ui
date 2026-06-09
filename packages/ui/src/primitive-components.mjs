import {
  componentVocabulary,
  getComponentDefinition,
  validateComponentProps,
  vocabularyHandshake,
} from "./vocabulary.mjs";

export const PRIMITIVE_COMPONENT_IMPLEMENTATION_VERSION =
  "2026-06-09.framework-neutral-component-factory";

const byName = new Map(componentVocabulary.map((definition) => [definition.name, definition]));

function compactProps(props) {
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== null && value !== false) out[key] = value;
  }
  return out;
}

function element(type, props = {}, ...children) {
  return {
    type,
    props: compactProps(props),
    children: children.flat().filter((child) => child !== undefined && child !== null && child !== false),
  };
}

function text(value) {
  return String(value ?? "");
}

function fallbackText(value, fallback) {
  const normalized = text(value).trim();
  return normalized.length > 0 ? normalized : fallback;
}

function slug(value) {
  const normalized = text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "field";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function displayValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "function" || typeof value === "symbol") return "[unsupported value]";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[unserializable value]";
    }
  }
  return String(value);
}

function safeChild(value) {
  if (value === undefined || value === null || value === false) return null;
  return displayValue(value);
}

function safeChildren(value) {
  const values = Array.isArray(value) ? value.flat(Infinity) : [value];
  return values.map(safeChild).filter((child) => child !== null);
}

function childrenOrLabel(props, fallback) {
  if (props.children !== undefined) return safeChildren(props.children);
  if (props.label !== undefined) return [text(props.label)];
  return [fallback];
}

function normalizeVariant(value, fallback, allowed) {
  return allowed.includes(value) ? value : fallback;
}

function renderButton(props = {}) {
  const variant = normalizeVariant(props.variant, "primary", ["primary", "secondary", "ghost", "danger"]);
  const size = normalizeVariant(props.size, "regular", ["compact", "regular"]);
  const label = fallbackText(props.label ?? props.ariaLabel, props.loading ? "Loading" : "Action");
  return element(
    "button",
    {
      type: "button",
      className: "jami-button",
      "data-variant": variant,
      "data-size": size,
      "data-action-ref": props.actionRef,
      disabled: props.disabled || props.loading,
      "aria-busy": props.loading ? "true" : undefined,
      "aria-label": props.ariaLabel && !props.label ? props.ariaLabel : undefined,
    },
    ...childrenOrLabel({ ...props, label }, label),
  );
}

function renderPanel(props = {}) {
  const tone = normalizeVariant(props.tone, "neutral", ["neutral", "accent", "danger"]);
  const title = props.title ? element("h3", { className: "jami-panel-title" }, text(props.title)) : null;
  const body =
    props.empty === true
      ? element("p", { role: "status" }, "No content yet.")
      : props.error
        ? element("p", { role: "alert" }, text(props.error))
        : safeChildren(props.children);
  return element(
    "section",
    {
      className: "jami-panel",
      "data-tone": tone,
      "data-empty": props.empty ? "true" : undefined,
      role: "region",
      "aria-label": props.ariaLabel ?? props.title ?? "Panel",
    },
    title,
    ...body,
  );
}

function renderTextField(props = {}) {
  const id = `jami-field-${slug(props.label)}`;
  const helpId = props.helperText || props.errorText ? `${id}-help` : undefined;
  return element(
    "label",
    { className: "jami-field", htmlFor: id },
    element("span", { className: "jami-field-label" }, fallbackText(props.label, "Field")),
    element("input", {
      id,
      name: id,
      type: "text",
      defaultValue: props.value,
      placeholder: props.placeholder,
      disabled: props.disabled,
      "aria-invalid": props.invalid ? "true" : undefined,
      "aria-describedby": helpId,
    }),
    props.errorText
      ? element("span", { id: helpId, role: "alert" }, text(props.errorText))
      : props.helperText
        ? element("span", { id: helpId }, text(props.helperText))
        : null,
  );
}

function columnKey(column, index) {
  if (typeof column === "string") return column;
  return column?.key ?? `column-${index + 1}`;
}

function columnLabel(column, index) {
  if (typeof column === "string") return column;
  return column?.label ?? column?.key ?? `Column ${index + 1}`;
}

function renderDataList(props = {}) {
  const columns = safeArray(props.columns);
  const rows = safeArray(props.rows);
  const title = props.title ? element("h3", { className: "jami-data-list-title" }, text(props.title)) : null;
  const status =
    props.loading || props.empty || props.error || rows.length === 0
      ? element(
          "p",
          { role: props.error ? "alert" : "status" },
          props.error ? text(props.error) : props.loading ? "Loading records." : "No records to display.",
        )
      : null;
  const table =
    columns.length > 0 && rows.length > 0
      ? element(
          "table",
          { className: "jami-data-list-table" },
          element(
            "thead",
            {},
            element(
              "tr",
              {},
              ...columns.map((column, index) =>
                element("th", { scope: "col" }, text(columnLabel(column, index))),
              ),
            ),
          ),
          element(
            "tbody",
            {},
            ...rows.map((row) =>
              element(
                "tr",
                {},
                ...columns.map((column, index) =>
                  element("td", {}, displayValue(row?.[columnKey(column, index)])),
                ),
              ),
            ),
          ),
        )
      : null;
  return element(
    "section",
    {
      className: "jami-data-list",
      role: "region",
      "aria-label": props.ariaLabel ?? props.title ?? "Data list",
      "aria-busy": props.loading ? "true" : undefined,
    },
    title,
    status,
    table,
  );
}

function renderAgentPanel(props = {}) {
  const status = normalizeVariant(props.status, "idle", [
    "idle",
    "running",
    "needs_attention",
    "denied",
    "error",
  ]);
  const actionRefs = safeArray(props.actionRefs);
  const artifactViewRefs = safeArray(props.artifactViewRefs);
  return element(
    "section",
    {
      className: "jami-agent-panel",
      role: "status",
      "aria-live": "polite",
      "aria-label": props.title ?? props.agentName ?? "Agent status",
      "data-status": status,
    },
    element("h3", {}, fallbackText(props.title ?? props.agentName, "Agent")),
    element("p", {}, status.replaceAll("_", " ")),
    actionRefs.length
      ? element(
          "ul",
          { className: "jami-action-ref-list", "aria-label": "Action references" },
          ...actionRefs.map((ref) => element("li", { "data-action-ref": ref }, text(ref))),
        )
      : null,
    artifactViewRefs.length
      ? element(
          "ul",
          { className: "jami-artifact-ref-list", "aria-label": "Artifact view references" },
          ...artifactViewRefs.map((ref) => element("li", { "data-artifact-view-ref": ref }, text(ref))),
        )
      : null,
  );
}

function sourceId(source, index) {
  return source?.id ?? source?.sourceId ?? `source-${index + 1}`;
}

function sourceTitle(source, index) {
  return source?.title ?? source?.label ?? sourceId(source, index);
}

function renderDocsSourcePanel(props = {}) {
  const sources = safeArray(props.sources);
  const selectedSourceId = props.selectedSourceId ?? null;
  return element(
    "aside",
    {
      className: "jami-docs-source-panel",
      role: "complementary",
      "aria-label": props.ariaLabel ?? props.title ?? "Sources",
      "data-redacted": props.redacted ? "true" : undefined,
    },
    element("h3", {}, fallbackText(props.title, "Sources")),
    props.redacted ? element("p", { role: "status" }, "Source details are redacted.") : null,
    props.empty || sources.length === 0
      ? element("p", { role: "status" }, "No sources attached.")
      : element(
          "ul",
          { className: "jami-source-list" },
          ...sources.map((source, index) =>
            element(
              "li",
              {
                "data-source-id": sourceId(source, index),
                "aria-current": selectedSourceId === sourceId(source, index) ? "true" : undefined,
              },
              text(sourceTitle(source, index)),
            ),
          ),
        ),
  );
}

function mediaItemId(item, index) {
  return item?.id ?? item?.artifactId ?? `media-${index + 1}`;
}

function mediaItemLabel(item, index) {
  return item?.title ?? item?.label ?? item?.alt ?? mediaItemId(item, index);
}

function renderMediaGrid(props = {}) {
  const items = safeArray(props.items);
  const selectedItemId = props.selectedItemId ?? null;
  const status =
    props.error || props.loading || props.empty || items.length === 0
      ? element(
          "p",
          { role: props.error ? "alert" : "status" },
          props.error ? text(props.error) : props.loading ? "Loading media." : "No media items.",
        )
      : null;
  return element(
    "section",
    {
      className: "jami-media-grid",
      role: "region",
      "aria-label": props.ariaLabel ?? props.title ?? "Media",
      "aria-busy": props.loading ? "true" : undefined,
    },
    props.title ? element("h3", {}, text(props.title)) : null,
    status,
    items.length
      ? element(
          "ul",
          { className: "jami-media-grid-list" },
          ...items.map((item, index) =>
            element(
              "li",
              {
                "data-media-id": mediaItemId(item, index),
                "aria-current": selectedItemId === mediaItemId(item, index) ? "true" : undefined,
              },
              text(mediaItemLabel(item, index)),
            ),
          ),
        )
      : null,
  );
}

const renderers = Object.freeze({
  button: renderButton,
  panel: renderPanel,
  "text-field": renderTextField,
  "data-list": renderDataList,
  "agent-panel": renderAgentPanel,
  "docs-source-panel": renderDocsSourcePanel,
  "media-grid": renderMediaGrid,
});

export const primitiveComponentImplementations = Object.freeze(
  Object.fromEntries(
    componentVocabulary.map((definition) => [
      definition.name,
      Object.freeze({
        schemaVersion: PRIMITIVE_COMPONENT_IMPLEMENTATION_VERSION,
        component: definition.name,
        registryItem: definition.registryItem,
        namespace: definition.namespace,
        vocabularyHandshake: vocabularyHandshake.schemaVersion,
        propSchemaVersion: definition.propSchema.schemaVersion,
        implementationStatus: "framework-neutral-component-factory",
        source: "packages/ui/src/primitive-components.mjs",
        radixWrapper: false,
        runtimeReactRenderer: false,
        executableActions: false,
      }),
    ]),
  ),
);

export function getPrimitiveComponentImplementation(name) {
  return primitiveComponentImplementations[name] ?? null;
}

export function renderPrimitiveSpec(name, props = {}) {
  const definition = getComponentDefinition(name);
  if (!definition) {
    return {
      state: "unsupported",
      reasons: [`component ${name} is not part of the resident vocabulary`],
      node: element("section", { className: "jami-panel", role: "status" }, "Unsupported component."),
    };
  }
  const { children, ...schemaProps } = props;
  const reasons = validateComponentProps(name, schemaProps);
  if (reasons.length > 0) {
    return {
      state: "invalid",
      reasons,
      node: element("section", { className: "jami-panel", role: "alert", "data-tone": "danger" }, "Invalid props."),
    };
  }
  return {
    state: "renderable",
    reasons: [],
    node: renderers[name](props),
  };
}

export function createJamiPrimitiveComponents(createElement) {
  if (typeof createElement !== "function") {
    throw new TypeError("createJamiPrimitiveComponents requires a createElement function");
  }
  const fromSpec = (spec) => createElement(spec.type, spec.props, ...spec.children.map((child) => {
    if (child && typeof child === "object" && child.type && child.props && Array.isArray(child.children)) {
      return fromSpec(child);
    }
    return child;
  }));
  const make = (name) =>
    function JamiPrimitiveComponent(props = {}) {
      const result = renderPrimitiveSpec(name, props);
      return fromSpec(result.node);
    };
  return Object.freeze({
    Button: make("button"),
    Panel: make("panel"),
    TextField: make("text-field"),
    DataList: make("data-list"),
    AgentPanel: make("agent-panel"),
    DocsSourcePanel: make("docs-source-panel"),
    MediaGrid: make("media-grid"),
  });
}

export const primitiveComponentNames = Object.freeze([...byName.keys()]);

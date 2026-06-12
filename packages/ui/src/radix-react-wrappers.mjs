import * as React from "react";
import { Root as RadixLabelRoot } from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";

export const JAMI_RADIX_REACT_WRAPPER_SOURCE = "packages/ui/src/radix-react-wrappers.mjs";

function h(type, props, ...children) {
  return React.createElement(type, props, ...children);
}

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

function text(value) {
  return String(value ?? "");
}

function fallbackText(value, fallback) {
  const normalized = text(value).trim();
  return normalized.length > 0 ? normalized : fallback;
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

function normalizeVariant(value, fallback, allowed) {
  return allowed.includes(value) ? value : fallback;
}

function isUnsafeProp(key, value) {
  const normalizedKey = key.replace(/[-_]/g, "").toLowerCase();
  if (/^on[A-Za-z]/.test(key)) return true;
  if (
    normalizedKey === "dangerouslysetinnerhtml" ||
    normalizedKey === "innerhtml" ||
    normalizedKey === "outerhtml" ||
    normalizedKey === "srcdoc" ||
    normalizedKey === "html"
  ) {
    return true;
  }
  if (
    normalizedKey === "executable" ||
    normalizedKey === "canexecute" ||
    normalizedKey.includes("canexecute") ||
    normalizedKey.endsWith("executable")
  ) {
    return true;
  }
  if (["href", "src", "action", "formaction", "xlinkhref"].includes(normalizedKey) && typeof value === "string") {
    return value.trim().toLowerCase().startsWith("javascript:");
  }
  return false;
}

function slug(value) {
  const normalized = text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "field";
}

function compactProps(props) {
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    if (isUnsafeProp(key, value)) continue;
    if (value !== undefined && value !== null && value !== false) out[key] = value;
  }
  return out;
}

function sanitizedCloneProps(props) {
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    out[key] = isUnsafeProp(key, value) ? undefined : value;
  }
  return out;
}

function sanitizeReactNode(node) {
  if (Array.isArray(node)) return node.map((child) => sanitizeReactNode(child));
  if (!React.isValidElement(node)) return node;

  const { children, ...props } = node.props ?? {};
  return React.cloneElement(node, sanitizedCloneProps(props), sanitizeReactNode(children));
}

export const JamiButton = React.forwardRef(function JamiButton(
  {
    asChild = false,
    label,
    ariaLabel,
    variant = "primary",
    size = "regular",
    disabled = false,
    loading = false,
    actionRef,
    className,
    children,
    type = "button",
    ...domProps
  } = {},
  ref,
) {
  const Comp = asChild ? Slot : "button";
  const normalizedVariant = normalizeVariant(variant, "primary", [
    "primary",
    "secondary",
    "ghost",
    "danger",
  ]);
  const normalizedSize = normalizeVariant(size, "regular", ["compact", "regular"]);
  const content = sanitizeReactNode(children ?? fallbackText(label ?? ariaLabel, loading ? "Loading" : "Action"));
  return h(
    Comp,
    compactProps({
      ...domProps,
      ref,
      type: asChild ? undefined : type,
      className: joinClassNames("jami-button", className),
      "data-variant": normalizedVariant,
      "data-size": normalizedSize,
      "data-action-ref": actionRef,
      disabled: disabled || loading,
      "aria-disabled": asChild && (disabled || loading) ? "true" : undefined,
      "aria-busy": loading ? "true" : undefined,
      "aria-label": ariaLabel && !label && children === undefined ? ariaLabel : undefined,
    }),
    content,
  );
});

export const JamiPanel = React.forwardRef(function JamiPanel(
  {
    title,
    ariaLabel,
    tone = "neutral",
    empty = false,
    error,
    className,
    children,
    ...domProps
  } = {},
  ref,
) {
  const normalizedTone = normalizeVariant(tone, "neutral", ["neutral", "accent", "danger"]);
  const body = empty
    ? h("p", { role: "status" }, "No content yet.")
    : error
      ? h("p", { role: "alert" }, text(error))
      : children;
  return h(
    "section",
    compactProps({
      ...domProps,
      ref,
      className: joinClassNames("jami-panel", className),
      "data-tone": normalizedTone,
      "data-empty": empty ? "true" : undefined,
      role: "region",
      "aria-label": ariaLabel ?? title ?? "Panel",
    }),
    title ? h("h3", { className: "jami-panel-title" }, text(title)) : null,
    body,
  );
});

export const JamiTextField = React.forwardRef(function JamiTextField(
  {
    label,
    value,
    placeholder,
    disabled = false,
    invalid = false,
    errorText,
    helperText,
    id,
    className,
    inputClassName,
    ...inputProps
  } = {},
  ref,
) {
  const fieldLabel = fallbackText(label, "Field");
  const fieldId = id ?? `jami-field-${slug(fieldLabel)}`;
  const helpId = helperText || errorText ? `${fieldId}-help` : undefined;
  return h(
    RadixLabelRoot,
    {
      className: joinClassNames("jami-field", className),
      htmlFor: fieldId,
    },
    h("span", { className: "jami-field-label" }, fieldLabel),
    h(
      "input",
      compactProps({
        ...inputProps,
        ref,
        id: fieldId,
        name: inputProps.name ?? fieldId,
        className: inputClassName,
        type: inputProps.type ?? "text",
        defaultValue: value,
        placeholder,
        disabled,
        "aria-invalid": invalid ? "true" : undefined,
        "aria-describedby": helpId,
      }),
    ),
    errorText
      ? h("span", { id: helpId, role: "alert" }, text(errorText))
      : helperText
        ? h("span", { id: helpId }, text(helperText))
        : null,
  );
});

function columnKey(column, index) {
  if (typeof column === "string") return column;
  return column?.key ?? `column-${index + 1}`;
}

function columnLabel(column, index) {
  if (typeof column === "string") return column;
  return column?.label ?? column?.key ?? `Column ${index + 1}`;
}

export const JamiDataList = React.forwardRef(function JamiDataList(
  {
    title,
    ariaLabel,
    columns = [],
    rows = [],
    empty = false,
    loading = false,
    error,
    className,
    ...domProps
  } = {},
  ref,
) {
  const safeColumns = safeArray(columns);
  const safeRows = safeArray(rows);
  const status =
    loading || empty || error || safeRows.length === 0
      ? h(
          "p",
          { role: error ? "alert" : "status" },
          error ? text(error) : loading ? "Loading records." : "No records to display.",
        )
      : null;
  const table =
    safeColumns.length > 0 && safeRows.length > 0
      ? h(
          "table",
          { className: "jami-data-list-table" },
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              ...safeColumns.map((column, index) => h("th", { scope: "col" }, text(columnLabel(column, index)))),
            ),
          ),
          h(
            "tbody",
            null,
            ...safeRows.map((row, rowIndex) =>
              h(
                "tr",
                { key: `row-${rowIndex}` },
                ...safeColumns.map((column, index) =>
                  h("td", { key: columnKey(column, index) }, displayValue(row?.[columnKey(column, index)])),
                ),
              ),
            ),
          ),
        )
      : null;
  return h(
    "section",
    compactProps({
      ...domProps,
      ref,
      className: joinClassNames("jami-data-list", className),
      role: "region",
      "aria-label": ariaLabel ?? title ?? "Data list",
      "aria-busy": loading ? "true" : undefined,
    }),
    title ? h("h3", { className: "jami-data-list-title" }, text(title)) : null,
    status,
    table,
  );
});

export const JamiAgentPanel = React.forwardRef(function JamiAgentPanel(
  {
    title,
    agentName,
    status = "idle",
    actionRefs = [],
    artifactViewRefs = [],
    className,
    ...domProps
  } = {},
  ref,
) {
  const normalizedStatus = normalizeVariant(status, "idle", [
    "idle",
    "running",
    "needs_attention",
    "denied",
    "error",
  ]);
  return h(
    "section",
    compactProps({
      ...domProps,
      ref,
      className: joinClassNames("jami-agent-panel", className),
      role: "status",
      "aria-live": "polite",
      "aria-label": title ?? agentName ?? "Agent status",
      "data-status": normalizedStatus,
    }),
    h("h3", null, fallbackText(title ?? agentName, "Agent")),
    h("p", null, normalizedStatus.replaceAll("_", " ")),
    safeArray(actionRefs).length
      ? h(
          "ul",
          { className: "jami-action-ref-list", "aria-label": "Action references" },
          ...safeArray(actionRefs).map((ref) => h("li", { key: ref, "data-action-ref": ref }, text(ref))),
        )
      : null,
    safeArray(artifactViewRefs).length
      ? h(
          "ul",
          { className: "jami-artifact-ref-list", "aria-label": "Artifact view references" },
          ...safeArray(artifactViewRefs).map((ref) =>
            h("li", { key: ref, "data-artifact-view-ref": ref }, text(ref)),
          ),
        )
      : null,
  );
});

function sourceId(source, index) {
  return source?.id ?? source?.sourceId ?? `source-${index + 1}`;
}

function sourceTitle(source, index) {
  return source?.title ?? source?.label ?? sourceId(source, index);
}

export const JamiDocsSourcePanel = React.forwardRef(function JamiDocsSourcePanel(
  {
    title,
    ariaLabel,
    sources = [],
    selectedSourceId,
    redacted = false,
    empty = false,
    className,
    ...domProps
  } = {},
  ref,
) {
  const safeSources = safeArray(sources);
  return h(
    "aside",
    compactProps({
      ...domProps,
      ref,
      className: joinClassNames("jami-docs-source-panel", className),
      role: "complementary",
      "aria-label": ariaLabel ?? title ?? "Sources",
      "data-redacted": redacted ? "true" : undefined,
    }),
    h("h3", null, fallbackText(title, "Sources")),
    redacted ? h("p", { role: "status" }, "Source details are redacted.") : null,
    empty || safeSources.length === 0
      ? h("p", { role: "status" }, "No sources attached.")
      : h(
          "ul",
          { className: "jami-source-list" },
          ...safeSources.map((source, index) =>
            h(
              "li",
              {
                key: sourceId(source, index),
                "data-source-id": sourceId(source, index),
                "aria-current": selectedSourceId === sourceId(source, index) ? "true" : undefined,
              },
              text(sourceTitle(source, index)),
            ),
          ),
        ),
  );
});

function mediaItemId(item, index) {
  return item?.id ?? item?.artifactId ?? `media-${index + 1}`;
}

function mediaItemLabel(item, index) {
  return item?.title ?? item?.label ?? item?.alt ?? mediaItemId(item, index);
}

export const JamiMediaGrid = React.forwardRef(function JamiMediaGrid(
  {
    title,
    ariaLabel,
    items = [],
    selectedItemId,
    loading = false,
    empty = false,
    error,
    className,
    ...domProps
  } = {},
  ref,
) {
  const safeItems = safeArray(items);
  const status =
    error || loading || empty || safeItems.length === 0
      ? h(
          "p",
          { role: error ? "alert" : "status" },
          error ? text(error) : loading ? "Loading media." : "No media items.",
        )
      : null;
  return h(
    "section",
    compactProps({
      ...domProps,
      ref,
      className: joinClassNames("jami-media-grid", className),
      role: "region",
      "aria-label": ariaLabel ?? title ?? "Media",
      "aria-busy": loading ? "true" : undefined,
    }),
    title ? h("h3", null, text(title)) : null,
    status,
    safeItems.length
      ? h(
          "ul",
          { className: "jami-media-grid-list" },
          ...safeItems.map((item, index) =>
            h(
              "li",
              {
                key: mediaItemId(item, index),
                "data-media-id": mediaItemId(item, index),
                "aria-current": selectedItemId === mediaItemId(item, index) ? "true" : undefined,
              },
              text(mediaItemLabel(item, index)),
            ),
          ),
        )
      : null,
  );
});

export const radixReactWrapperComponents = Object.freeze({
  JamiButton,
  JamiPanel,
  JamiTextField,
  JamiDataList,
  JamiAgentPanel,
  JamiDocsSourcePanel,
  JamiMediaGrid,
});

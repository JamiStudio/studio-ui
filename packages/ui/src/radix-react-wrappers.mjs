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

function normalizeVariant(value, fallback, allowed) {
  return allowed.includes(value) ? value : fallback;
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
    if (value !== undefined && value !== null && value !== false) out[key] = value;
  }
  return out;
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
  const content = children ?? fallbackText(label ?? ariaLabel, loading ? "Loading" : "Action");
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

export const radixReactWrapperComponents = Object.freeze({
  JamiButton,
  JamiPanel,
  JamiTextField,
});

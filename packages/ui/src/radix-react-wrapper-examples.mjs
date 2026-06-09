import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  JamiButton,
  JamiPanel,
  JamiTextField,
} from "./radix-react-wrappers.mjs";
import { getRadixReactWrapperEvidence } from "./radix-wrapper-evidence.mjs";

function h(type, props, ...children) {
  return React.createElement(type, props, ...children);
}

function example(component, id, element) {
  return Object.freeze({
    component,
    id,
    evidence: getRadixReactWrapperEvidence(component),
    html: renderToStaticMarkup(element),
  });
}

export function renderRadixReactWrapperExamples() {
  return Object.freeze([
    example(
      "button",
      "button-action",
      h(JamiButton, {
        label: "Review evidence",
        variant: "primary",
        actionRef: "act_review_evidence",
      }),
    ),
    example(
      "button",
      "button-as-child",
      h(
        JamiButton,
        { asChild: true, variant: "secondary", ariaLabel: "Open solo suite" },
        h("a", { href: "#suite-solo" }, "Open solo suite"),
      ),
    ),
    example(
      "panel",
      "panel-region",
      h(JamiPanel, { title: "Wrapper evidence", tone: "accent" }, "React wrapper surface using token classes."),
    ),
    example(
      "text-field",
      "text-field-labelled",
      h(JamiTextField, {
        label: "Search sources",
        placeholder: "Find a source",
        helperText: "Radix Label associates the label with the input.",
      }),
    ),
  ]);
}

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  JamiAgentPanel,
  JamiButton,
  JamiDataList,
  JamiDocsSourcePanel,
  JamiMediaGrid,
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
    example(
      "data-list",
      "data-list-records",
      h(JamiDataList, {
        title: "Evidence queue",
        columns: [{ key: "name", label: "Name" }],
        rows: [{ name: "Wrapper provenance" }],
      }),
    ),
    example(
      "agent-panel",
      "agent-panel-display-only",
      h(JamiAgentPanel, {
        title: "Review agent",
        status: "needs_attention",
        actionRefs: ["act_review_evidence"],
        artifactViewRefs: ["artv_trace_review"],
      }),
    ),
    example(
      "docs-source-panel",
      "docs-source-panel-redacted",
      h(JamiDocsSourcePanel, {
        title: "Sources",
        redacted: true,
        sources: [{ id: "src_foundation", title: "Foundation alignment" }],
      }),
    ),
    example(
      "media-grid",
      "media-grid-artifacts",
      h(JamiMediaGrid, {
        title: "Artifacts",
        items: [{ id: "art_wrapper", title: "Wrapper screenshot placeholder" }],
      }),
    ),
  ]);
}

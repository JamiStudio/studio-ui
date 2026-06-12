import assert from "node:assert/strict";
import { test } from "node:test";
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
} from "../src/radix-react-wrappers.mjs";
import { renderRadixReactWrapperExamples } from "../src/radix-react-wrapper-examples.mjs";
import {
  getRadixReactWrapperEvidence,
  implementedRadixReactWrapperNames,
  radixReactWrapperPackageEvidence,
} from "../src/radix-wrapper-evidence.mjs";
import { validateComponentProps } from "../src/vocabulary.mjs";

function h(type, props, ...children) {
  return React.createElement(type, props, ...children);
}

function assertSafeStaticMarkup(html) {
  assert.equal(/<script/i.test(html), false, "wrapper markup must not emit scripts");
  assert.equal(/<[^>]+\son[a-z]+\s*=/i.test(html), false, "wrapper markup must not emit inline event handlers");
  assert.equal(/(href|src)\s*=\s*["']?\s*javascript:/i.test(html), false, "wrapper markup must not emit javascript URLs");
}

test("wrapper evidence records the implemented resident component slice", () => {
  assert.deepEqual(implementedRadixReactWrapperNames, [
    "button",
    "panel",
    "text-field",
    "data-list",
    "agent-panel",
    "docs-source-panel",
    "media-grid",
  ]);
  assert.equal(radixReactWrapperPackageEvidence.react.version, "19.2.7");
  assert.equal(radixReactWrapperPackageEvidence.radixSlot.version, "1.2.5");
  assert.equal(radixReactWrapperPackageEvidence.radixLabel.version, "2.1.9");

  assert.equal(getRadixReactWrapperEvidence("button").exportName, "JamiButton");
  assert.deepEqual(getRadixReactWrapperEvidence("button").radixPackages, ["@radix-ui/react-slot@1.2.5"]);
  assert.equal(getRadixReactWrapperEvidence("panel").exportName, "JamiPanel");
  assert.deepEqual(getRadixReactWrapperEvidence("panel").radixPackages, []);
  assert.equal(getRadixReactWrapperEvidence("text-field").exportName, "JamiTextField");
  assert.deepEqual(getRadixReactWrapperEvidence("text-field").radixPackages, ["@radix-ui/react-label@2.1.9"]);
  assert.equal(getRadixReactWrapperEvidence("data-list").exportName, "JamiDataList");
  assert.equal(getRadixReactWrapperEvidence("agent-panel").exportName, "JamiAgentPanel");
  assert.equal(getRadixReactWrapperEvidence("docs-source-panel").exportName, "JamiDocsSourcePanel");
  assert.equal(getRadixReactWrapperEvidence("media-grid").exportName, "JamiMediaGrid");
  for (const name of ["data-list", "agent-panel", "docs-source-panel", "media-grid"]) {
    assert.deepEqual(getRadixReactWrapperEvidence(name).radixPackages, []);
    assert.equal(getRadixReactWrapperEvidence(name).runtimeReactRenderer, false);
    assert.equal(getRadixReactWrapperEvidence(name).rendererPayloadExecution, false);
  }
});

test("JamiButton renders a tokenized React button aligned to the resident schema", () => {
  assert.deepEqual(validateComponentProps("button", { label: "Review evidence", variant: "primary" }), []);
  const html = renderToStaticMarkup(
    h(JamiButton, {
      label: "Review evidence",
      variant: "primary",
      actionRef: "act_review_evidence",
    }),
  );
  assert.match(html, /^<button /);
  assert.match(html, /class="jami-button"/);
  assert.match(html, /data-variant="primary"/);
  assert.match(html, /data-action-ref="act_review_evidence"/);
  assert.match(html, />Review evidence<\/button>$/);
  assertSafeStaticMarkup(html);
});

test("JamiButton uses Radix Slot for asChild composition without changing the renderer boundary", () => {
  const html = renderToStaticMarkup(
    h(
      JamiButton,
      { asChild: true, variant: "secondary", ariaLabel: "Open solo suite" },
      h("a", { href: "#suite-solo" }, "Open solo suite"),
    ),
  );
  assert.match(html, /^<a /, "asChild renders the child element");
  assert.equal(html.includes("<button"), false, "Radix Slot avoids an extra button wrapper");
  assert.match(html, /href="#suite-solo"/);
  assert.match(html, /class="jami-button"/);
  assert.match(html, /data-variant="secondary"/);
  assertSafeStaticMarkup(html);
});

test("JamiPanel renders a labelled low-radius region with tokenized classes", () => {
  assert.deepEqual(validateComponentProps("panel", { title: "Wrapper evidence", tone: "accent" }), []);
  const html = renderToStaticMarkup(
    h(JamiPanel, { title: "Wrapper evidence", tone: "accent" }, "React wrapper surface"),
  );
  assert.match(html, /^<section /);
  assert.match(html, /class="jami-panel"/);
  assert.match(html, /data-tone="accent"/);
  assert.match(html, /role="region"/);
  assert.match(html, /aria-label="Wrapper evidence"/);
  assert.match(html, /<h3 class="jami-panel-title">Wrapper evidence<\/h3>/);
  assertSafeStaticMarkup(html);
});

test("JamiTextField uses Radix Label and emits a labelled native input", () => {
  assert.deepEqual(validateComponentProps("text-field", { label: "Search sources", helperText: "Find records" }), []);
  const html = renderToStaticMarkup(
    h(JamiTextField, {
      label: "Search sources",
      placeholder: "Find a source",
      helperText: "Find records",
    }),
  );
  assert.match(html, /^<label /);
  assert.match(html, /class="jami-field"/);
  assert.match(html, /for="jami-field-search-sources"/);
  assert.match(html, /<input /);
  assert.match(html, /id="jami-field-search-sources"/);
  assert.match(html, /aria-describedby="jami-field-search-sources-help"/);
  assert.match(html, /<span id="jami-field-search-sources-help">Find records<\/span>/);
  assertSafeStaticMarkup(html);
});

test("JamiDataList renders labelled display-only table content", () => {
  assert.deepEqual(
    validateComponentProps("data-list", {
      title: "Tasks",
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Review" }],
    }),
    [],
  );
  const html = renderToStaticMarkup(
    h(JamiDataList, {
      title: "Tasks",
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Review evidence" }],
    }),
  );
  assert.match(html, /^<section /);
  assert.match(html, /class="jami-data-list"/);
  assert.match(html, /role="region"/);
  assert.match(html, /<table class="jami-data-list-table">/);
  assert.match(html, /<th scope="col">Name<\/th>/);
  assert.match(html, /<td>Review evidence<\/td>/);
  assertSafeStaticMarkup(html);
});

test("JamiAgentPanel renders action and artifact refs as inert data", () => {
  assert.deepEqual(
    validateComponentProps("agent-panel", {
      title: "Review agent",
      status: "needs_attention",
      actionRefs: ["act_review"],
      artifactViewRefs: ["artv_trace"],
    }),
    [],
  );
  const html = renderToStaticMarkup(
    h(JamiAgentPanel, {
      title: "Review agent",
      status: "needs_attention",
      actionRefs: ["act_review"],
      artifactViewRefs: ["artv_trace"],
    }),
  );
  assert.match(html, /^<section /);
  assert.match(html, /class="jami-agent-panel"/);
  assert.match(html, /data-status="needs_attention"/);
  assert.match(html, /data-action-ref="act_review"/);
  assert.match(html, /data-artifact-view-ref="artv_trace"/);
  assertSafeStaticMarkup(html);
});

test("JamiDocsSourcePanel gates redacted source details", () => {
  assert.deepEqual(
    validateComponentProps("docs-source-panel", {
      title: "Sources",
      redacted: true,
      sources: [{ id: "src_1", title: "Foundation alignment" }],
    }),
    [],
  );
  const html = renderToStaticMarkup(
    h(JamiDocsSourcePanel, {
      title: "Sources",
      redacted: true,
      sources: [{ id: "src_1", title: "Foundation alignment" }],
    }),
  );
  assert.match(html, /^<aside /);
  assert.match(html, /class="jami-docs-source-panel"/);
  assert.match(html, /data-redacted="true"/);
  assert.match(html, /Source details are redacted/);
  assert.match(html, /data-source-id="src_1"/);
  assertSafeStaticMarkup(html);
});

test("JamiMediaGrid renders artifact gallery items without executable state", () => {
  assert.deepEqual(
    validateComponentProps("media-grid", {
      title: "Assets",
      items: [{ id: "art_1", title: "Frame 01" }],
    }),
    [],
  );
  const html = renderToStaticMarkup(
    h(JamiMediaGrid, {
      title: "Assets",
      items: [{ id: "art_1", title: "Frame 01" }],
      selectedItemId: "art_1",
    }),
  );
  assert.match(html, /^<section /);
  assert.match(html, /class="jami-media-grid"/);
  assert.match(html, /data-media-id="art_1"/);
  assert.match(html, /aria-current="true"/);
  assertSafeStaticMarkup(html);
});

test("server-rendered wrapper examples are real React output and stay inert", () => {
  const examples = renderRadixReactWrapperExamples();
  assert.equal(examples.length, 8);
  assert.deepEqual([...new Set(examples.map((example) => example.component))], [
    "button",
    "panel",
    "text-field",
    "data-list",
    "agent-panel",
    "docs-source-panel",
    "media-grid",
  ]);
  for (const example of examples) {
    assert.ok(example.evidence, `${example.id} carries wrapper evidence`);
    assert.match(
      example.html,
      /jami-(button|panel|field|data-list|agent-panel|docs-source-panel|media-grid)/,
      `${example.id} uses tokenized classes`,
    );
    assertSafeStaticMarkup(example.html);
  }
});

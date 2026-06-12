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

export const SUITE_REACT_MOUNT_VERSION = "2026-06-12.mounted-react-suite-routes";

export const suiteReactMountEvidence = Object.freeze({
  schemaVersion: SUITE_REACT_MOUNT_VERSION,
  source: "packages/ui/src/suites.mjs",
  packageName: "@jami-studio/ui",
  rendererBoundary: "React suite components are install-time/app code, not harness-originated renderer payload execution.",
  hostedRuntime: false,
  harnessRuntimeExecution: false,
  executableActions: false,
  serverRenderedStaticRoutes: true,
});

function h(type, props, ...children) {
  return React.createElement(type, props, ...children);
}

function text(value) {
  return String(value ?? "");
}

function refSlug(value) {
  return (
    text(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "ref"
  );
}

function routeSlug(path) {
  return (
    text(path)
      .toLowerCase()
      .replace(/^\/+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "index"
  );
}

function getBlocksForRoute(suite, route) {
  const blocks = new Map((suite.manifest.shell?.blocks ?? []).map((block) => [block.id, block]));
  return (route.blocks ?? []).map((blockId) => blocks.get(blockId)).filter(Boolean);
}

function longFixture(suite, block) {
  return (
    suite.manifest.shell?.stateFixtures?.longContent ??
    `${block.title ?? block.id} keeps long operational content wrapped inside the mounted suite surface.`
  );
}

function emptyFixture(suite, block) {
  return suite.manifest.shell?.stateFixtures?.empty ?? `${block.title ?? block.id} has no records to display.`;
}

function errorFixture(suite, block) {
  return suite.manifest.shell?.stateFixtures?.error ?? `${block.title ?? block.id} cannot load right now.`;
}

export function suiteRouteFileName(route) {
  return `${routeSlug(route.path)}.html`;
}

export function suiteAppRouteFileName(lane) {
  return `suites/${lane}/index.html`;
}

export function suitePageRouteFileName(lane, route) {
  return `suites/${lane}/${suiteRouteFileName(route)}`;
}

export function suiteBlockProps(suite, block, state = "ready") {
  const lane = suite.lane;
  const title = block.title ?? block.id;
  const id = refSlug(`${lane}_${block.id}`);
  const longText = longFixture(suite, block);
  const emptyText = emptyFixture(suite, block);
  const errorText = errorFixture(suite, block);

  switch (block.component) {
    case "button":
      return {
        label: state === "loading" ? "Loading" : title,
        variant: state === "error" ? "danger" : "primary",
        loading: state === "loading",
        disabled: state === "disabled",
        actionRef: `act_${id}`,
      };
    case "panel":
      return {
        title,
        tone: state === "error" ? "danger" : "neutral",
        empty: state === "empty",
        error: state === "error" ? errorText : undefined,
        children:
          state === "long-content"
            ? longText
            : `${title} is mounted from the Studio UI React suite component layer.`,
      };
    case "text-field":
      return {
        label: title,
        value: state === "long-content" ? longText : "",
        placeholder: emptyText,
        invalid: state === "invalid" || state === "error",
        errorText: state === "invalid" || state === "error" ? errorText : undefined,
        helperText: state === "invalid" || state === "error" ? undefined : longText,
      };
    case "data-list":
      return {
        title,
        columns: [
          { key: "item", label: "Item" },
          { key: "state", label: "State" },
        ],
        rows:
          state === "empty" || state === "error"
            ? []
            : [
                {
                  item: state === "long-content" ? longText : `${title} record`,
                  state: state === "ready" ? "ready" : state,
                },
              ],
        empty: state === "empty",
        error: state === "error" ? errorText : undefined,
      };
    case "agent-panel":
      return {
        title,
        status: state === "error" ? "error" : state === "empty" ? "idle" : "running",
        actionRefs: [`act_${id}_review`],
        artifactViewRefs: [`artv_${id}_trace`],
      };
    case "docs-source-panel":
      return {
        title,
        sources:
          state === "empty"
            ? []
            : [
                {
                  id: `src_${id}`,
                  title: state === "long-content" ? longText : `${title} source`,
                },
              ],
        selectedSourceId: state === "empty" ? undefined : `src_${id}`,
        redacted: state === "error",
        empty: state === "empty",
      };
    case "media-grid":
      return {
        title,
        items:
          state === "empty" || state === "error"
            ? []
            : [
                {
                  id: `art_${id}`,
                  title: state === "long-content" ? longText : `${title} item`,
                },
              ],
        selectedItemId: state === "empty" || state === "error" ? undefined : `art_${id}`,
        empty: state === "empty",
        error: state === "error" ? errorText : undefined,
      };
    default:
      return {};
  }
}

export function JamiSuiteBlock({ suite, block, state = "ready" }) {
  const props = suiteBlockProps(suite, block, state);
  const key = `${suite.lane}:${block.id}:${state}`;
  switch (block.component) {
    case "button":
      return h(JamiButton, { key, ...props });
    case "panel":
      return h(JamiPanel, { key, ...props });
    case "text-field":
      return h(JamiTextField, { key, ...props });
    case "data-list":
      return h(JamiDataList, { key, ...props });
    case "agent-panel":
      return h(JamiAgentPanel, { key, ...props });
    case "docs-source-panel":
      return h(JamiDocsSourcePanel, { key, ...props });
    case "media-grid":
      return h(JamiMediaGrid, { key, ...props });
    default:
      return h(JamiPanel, { key, title: block.title ?? block.id, error: "Unsupported suite block component." });
  }
}

export function JamiSuitePage({ suite, route }) {
  const shell = suite.manifest.shell;
  const page = (shell.pages ?? []).find((candidate) => candidate.id === route.page);
  const blocks = getBlocksForRoute(suite, route);
  return h(
    "section",
    {
      className: "jami-suite-page",
      "data-suite-lane": suite.lane,
      "data-suite-route": route.path,
      "data-react-suite-mount-version": SUITE_REACT_MOUNT_VERSION,
      "aria-labelledby": `${suite.lane}-${routeSlug(route.path)}-title`,
    },
    h("header", { className: "jami-suite-page-header" },
      h("p", { className: "jami-suite-eyebrow" }, suite.lane),
      h("h2", { id: `${suite.lane}-${routeSlug(route.path)}-title` }, route.title ?? page?.title ?? route.page),
      page?.description ? h("p", null, page.description) : null,
    ),
    h(
      "div",
      { className: "jami-suite-block-grid" },
      ...blocks.map((block) =>
        h(
          "article",
          { className: "jami-suite-block", key: block.id, "data-suite-block": block.id },
          h("div", { className: "jami-suite-block-label" }, block.title ?? block.id),
          h(JamiSuiteBlock, { suite, block, state: "ready" }),
          ...(block.stateExamples ?? []).map((state) =>
            h(
              "div",
              { className: "jami-suite-state", key: `${block.id}:${state}`, "data-suite-state": state },
              h("span", null, state),
              h(JamiSuiteBlock, { suite, block, state }),
            ),
          ),
        ),
      ),
    ),
  );
}

export function JamiSuiteApp({ suite, routePath = null }) {
  const shell = suite.manifest.shell;
  const routes = shell.routes ?? [];
  const selectedRoutes = routePath ? routes.filter((route) => route.path === routePath) : routes;
  return h(
    "div",
    {
      className: "jami-suite-app",
      "data-suite-lane": suite.lane,
      "data-react-suite-mount-version": SUITE_REACT_MOUNT_VERSION,
    },
    h(
      "header",
      { className: "jami-suite-app-header" },
      h("p", { className: "jami-suite-eyebrow" }, "Mounted React suite"),
      h("h1", null, shell.title),
      h("p", null, shell.summary),
      h(
        "nav",
        { className: "jami-suite-route-nav", "aria-label": `${shell.title} routes` },
        h(
          "ul",
          null,
          ...(shell.appShell?.navigation ?? []).map((item) =>
            h(
              "li",
              { key: item.route },
              h("a", { href: `#${routeSlug(item.route)}`, "aria-current": item.route === routePath ? "page" : undefined }, item.label),
            ),
          ),
        ),
      ),
    ),
    h(
      "main",
      { className: "jami-suite-pages" },
      ...selectedRoutes.map((route) =>
        h("div", { id: routeSlug(route.path), key: route.path }, h(JamiSuitePage, { suite, route })),
      ),
    ),
  );
}

export function renderSuiteAppStaticMarkup(suite) {
  return renderToStaticMarkup(h(JamiSuiteApp, { suite }));
}

export function renderSuitePageStaticMarkup(suite, route) {
  return renderToStaticMarkup(h(JamiSuitePage, { suite, route }));
}

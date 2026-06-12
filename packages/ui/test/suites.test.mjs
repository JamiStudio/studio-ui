import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  JamiSuiteApp,
  JamiSuiteBlock,
  JamiSuitePage,
  SUITE_REACT_MOUNT_VERSION,
  suiteAppRouteFileName,
  suiteBlockProps,
  suitePageRouteFileName,
  suiteReactMountEvidence,
} from "../src/suites.mjs";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const lanes = ["solo", "business-ops", "mixed-media", "research-writing"];

function h(type, props, ...children) {
  return React.createElement(type, props, ...children);
}

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function suite(lane) {
  return {
    lane,
    manifest: readJson(`packages/registry/generated/suites/${lane}.suite.json`),
  };
}

function assertSafeMarkup(html) {
  assert.equal(/<script/i.test(html), false, "suite markup must not emit scripts");
  assert.equal(/<[^>]+\son[a-z]+\s*=/i.test(html), false, "suite markup must not emit inline handlers");
  assert.equal(/(href|src)\s*=\s*["']?\s*javascript:/i.test(html), false, "suite markup must not emit javascript URLs");
  assert.equal(/data-executable|data-can-execute|executable="true"/i.test(html), false, "suite markup must not expose executable state");
}

test("suite React mount evidence is local and non-hosted", () => {
  assert.equal(SUITE_REACT_MOUNT_VERSION, "2026-06-12.mounted-react-suite-routes");
  assert.equal(suiteReactMountEvidence.source, "packages/ui/src/suites.mjs");
  assert.equal(suiteReactMountEvidence.serverRenderedStaticRoutes, true);
  assert.equal(suiteReactMountEvidence.hostedRuntime, false);
  assert.equal(suiteReactMountEvidence.harnessRuntimeExecution, false);
  assert.equal(suiteReactMountEvidence.executableActions, false);
});

test("all four suite apps render mounted React app/page/block surfaces", () => {
  for (const lane of lanes) {
    const current = suite(lane);
    const html = renderToStaticMarkup(h(JamiSuiteApp, { suite: current }));
    assert.match(html, new RegExp(`data-suite-lane="${lane}"`));
    assert.match(html, new RegExp(`data-react-suite-mount-version="${SUITE_REACT_MOUNT_VERSION}"`));
    assert.match(html, /class="jami-suite-app"/);
    assert.match(html, /class="jami-suite-page"/);
    assert.match(html, /class="jami-suite-block"/);
    for (const route of current.manifest.shell.routes) {
      assert.ok(html.includes(route.title), `${lane} route ${route.path} rendered`);
      assert.equal(suitePageRouteFileName(lane, route), `suites/${lane}/${route.path.replace(/^\/+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.html`);
    }
    assert.equal(suiteAppRouteFileName(lane), `suites/${lane}/index.html`);
    assertSafeMarkup(html);
  }
});

test("suite pages can render independently for every route", () => {
  for (const lane of lanes) {
    const current = suite(lane);
    for (const route of current.manifest.shell.routes) {
      const html = renderToStaticMarkup(h(JamiSuitePage, { suite: current, route }));
      assert.match(html, /class="jami-suite-page"/);
      assert.ok(html.includes(route.title), `${lane} page route title rendered`);
      for (const blockId of route.blocks) {
        assert.ok(html.includes(`data-suite-block="${blockId}"`), `${lane} page includes ${blockId}`);
      }
      assertSafeMarkup(html);
    }
  }
});

test("suite blocks render all declared state examples through resident wrappers", () => {
  for (const lane of lanes) {
    const current = suite(lane);
    for (const block of current.manifest.shell.blocks) {
      const states = ["ready", ...(block.stateExamples ?? [])];
      for (const state of states) {
        const props = suiteBlockProps(current, block, state);
        const html = renderToStaticMarkup(h(JamiSuiteBlock, { suite: current, block, state }));
        assert.match(html, /jami-(button|panel|field|data-list|agent-panel|docs-source-panel|media-grid)/);
        assert.ok(Object.keys(props).length > 0, `${lane} ${block.id} ${state} has props`);
        if (state === "empty") assert.match(html, /No records|No sources|No content|No media|idle/i);
        if (state === "error") assert.match(html, /alert|error|redacted|cannot load|review queue/i);
        assertSafeMarkup(html);
      }
    }
  }
});

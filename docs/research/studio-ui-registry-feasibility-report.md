# Studio UI Registry Feasibility Report

Date: 2026-06-07
Status: Authored for first planning pass
Request: Determine whether `studio-ui-registry` can become the full Jami.Studio primitive registry, token system, theme workbench overlay, preset/save flow, and recomposed Builder.io / Agent-Native suite system, with current engineering docs and future roadmaps shaped around that end state.
Source scope: Local docs and research in this repository, selected Yrka theme/workbench source paths, and official/current external sources checked on 2026-06-07.
Owner: Jamie / Jami.Studio

## Executive Summary

The build is feasible, and the clean shape is not a fresh component-library invention. The correct production target is an owned Jami.Studio registry built on the official shadcn registry mechanism, a fully tokenized DTCG-compatible token model, and an always-live theme workbench overlay that writes draft token state to the UI immediately and persists only on save.

The strongest foundation is:

- shadcn registry for build-time distribution of primitives, blocks, pages, fonts, themes, and base design-system items.
- Tailwind CSS theme variables plus CSS custom properties as the web runtime token lane.
- A Jami-owned token contract that covers all color, chart, semantic, typography, spacing, radius, shadow, motion, density, shell, and component-state tokens.
- A registry item metadata layer for Jami-specific package identity, suite ownership, token dependencies, agent-facing manifests, compatibility generation, and save/export metadata.
- A resident runtime component allowlist for agent-emitted UI payloads; shadcn remains install/build distribution, never a request-path renderer.
- A Yrka-influenced workbench overlay: dense, clean, collapsible, always live, with a compact status bar, docked control panels, save, duplicate, rename, register, export, and restore-to-factory flows.
- A warm, soft, muted Jami factory theme family anchored around `#C14D84`, with rich blue-green ranges instead of lime/yellow-green ranges.
- Four installable suite lanes: solo/general workflow, business ops, mixed-media, and research/writing.

The current repo is documentation and research only. That is an advantage for this stage: no runtime code has to be unwound before the architecture is made explicit. The immediate next move is to refresh engineering docs for `studio-ui-registry`, then write the active roadmap from this feasibility report.

## Question Being Answered

Can this project become the complete Jami.Studio Studio UI Registry: a downloadable and installable registry containing primitives, components, blocks, pages, tokenized themes, presets, and suite-specific template packages for solo/general workflows, business ops, mixed-media, and research/writing, while preserving an adaptable, provider-agnostic architecture and avoiding scattered configuration UI?

Answer: yes, if the project is treated as a registry plus design-system product, not as a template gallery. Templates are outputs. The root product is the token contract, registry package contract, authoring workbench, CLI/install flow, runtime render contract, and suite taxonomy.

The product decision after discussion is to make the workbench a control overlay over the actual live app/page, not a detached settings screen. The page remains the subject. The overlay provides the controls.

## Source Scope And Method

Local files checked:

- `docs/engineering/standards/report-style.md`
- `docs/engineering/standards/docs-standards.md`
- `docs/engineering/standards/planning-style.md`
- `docs/engineering/agents/goal.md`
- `docs/research/Rebuild.md`
- `docs/research/user-notes/goal.md`
- `docs/research/master/reports/B-agent-substrate/F09-ui-registry-and-render-seam.md`
- `docs/research/master/audits/12-agent-native/ui-registry-appearance.md`
- `docs/research/master/audits/12-agent-native/deep-dives/shadcn-as-agent-registry.md`
- `docs/research/master/audits/12-agent-native/recommendation.md`
- Yrka reference inventory under `C:\Users\james\projects\yrka\packages\design-tokens`, `C:\Users\james\projects\yrka\apps\web\lib\theme`, and `C:\Users\james\projects\yrka\apps\web\components\admin\dock`.

Commands run:

- `rg --files` for repository inventory.
- `Get-Content -Raw` against the documentation standards and relevant source reports.
- `git status --short --branch`, which reported this directory is not currently a Git repository.
- Yrka scoped file inventory for the design-token and appearance-panel reference set.

Official external sources checked:

- shadcn registry, registry item schema, namespace, MCP, theming, preset, and CLI documentation.
- Tailwind CSS theme variable documentation.
- W3C Design Tokens Community Group status and 2025.10 stable token specification announcement.
- Base UI official documentation.
- Agent-Native official docs for the template/application foundation.

Sources intentionally not checked in this pass:

- Live npm package metadata for every Agent-Native package.
- Current Builder.io repository source diff.
- Per-template license headers in the Builder.io / Agent-Native corpus.
- Any paid provider console or private registry hosting configuration.

## Current Project State

The repo currently contains `docs/` only. There is no application scaffold, package manifest, registry source tree, CLI package, component source, or Git metadata in this checkout. The command `git status --short --branch` returned `fatal: not a git repository`.

The documentation foundation is present but still carries Intercal-specific text in `docs/engineering/agents/goal.md` and `docs/engineering/standards/docs-standards.md`. The style rules and flows are useful, but codebase-specific references need to be refreshed before the roadmap becomes active.

The local research already supports the core direction:

- `docs/research/master/reports/B-agent-substrate/F09-ui-registry-and-render-seam.md` commits the two-lifecycle registry split: build-time shadcn seed, runtime resident allowlist renderer.
- `docs/research/master/audits/12-agent-native/ui-registry-appearance.md` identifies the Builder.io / Agent-Native gap: many template-local shadcn copies and no shared primitive registry.
- `docs/research/master/audits/12-agent-native/deep-dives/shadcn-as-agent-registry.md` maps shadcn registry, tokenization, MCP discovery, and the agent-facing SDUI manifest gap.
- `docs/research/master/audits/12-agent-native/recommendation.md` recommends adopting Agent-Native seams while building the Jami shared primitive registry and tokenized accent system.

The Yrka reference path exists and is relevant. The files under `packages/design-tokens/src/business-theme-*`, `apps/web/lib/theme/workbench-*`, and `apps/web/components/admin/dock/appearance-*` provide the strongest local pattern for dense, organized, always-live configuration without spreading controls across product pages.

## Official / External Findings

shadcn is currently the right distribution substrate. Its registry docs describe running an owned code registry, and the registry item schema supports `registry:base`, `registry:block`, `registry:component`, `registry:font`, `registry:ui`, `registry:page`, `registry:theme`, and other item types. The schema also supports `registryDependencies`, `cssVars`, `css`, `envVars`, `font`, `docs`, and `meta`.

shadcn namespaced registries map cleanly to an owned Jami namespace. The official namespace docs show `registries` entries such as `@acme-ui` resolving item URLs and describe inspection before installation with `shadcn view`. They also recommend documented revision schemes, pinning, discovery endpoints, and cache headers.

shadcn MCP is authoring/install infrastructure, not the runtime render layer. The official MCP page describes the server as a bridge between an AI assistant, component registries, and the shadcn CLI; it fetches and installs resources into projects. This matches the local recommendation: use MCP for registry discovery and installation, not for rendering arbitrary UI in the app request path.

shadcn theming is already CSS-variable-first. The official theming docs recommend CSS variables, semantic tokens such as `background`, `foreground`, and `primary`, and `tailwind.cssVariables: true`. They list current base colors including Neutral, Stone, Zinc, Mauve, Olive, Mist, and Taupe. April 2026 preset changes also allow applying only theme or font parts from a preset.

Tailwind's current theme-variable model supports the product's token direction. Tailwind documents `@theme` variables as design tokens that create utility classes and also explains sharing token CSS across projects by importing a shared CSS file.

The W3C Design Tokens Community Group announced a stable 2025.10 specification covering tool-neutral token exchange, theming, multi-brand support, modern color spaces including Oklch, and token relationships. This gives the registry a standards-shaped source format instead of an ad hoc JSON shape.

Base UI is now a viable primitive base option for shadcn projects, while Radix remains the safer default for this registry. shadcn CLI docs allow `init --base radix` or Base UI. Base UI is official, accessible, headless, and composable, but the local research and existing Builder/Yrka references are Radix/shadcn-shaped. The registry should default to Radix while keeping the contract open enough to support Base UI-family items later.

Agent-Native official docs confirm a template-driven, ownable, agent-native app direction, including one-command local creation and apps that can be customized by coding agents. That supports treating Builder.io / Agent-Native as a reference corpus and seam source, while the Jami registry owns the shared primitives, tokens, and packaging.

## Industry Standard Shape

The standard shape for a serious 2026 design-system registry is:

- Source tokens in a vendor-neutral JSON token format.
- Generated runtime outputs for web CSS variables, Tailwind theme variables, TypeScript token types, registry theme items, and documentation artifacts.
- One owned component registry, with install-time source inlining and reproducible item metadata.
- Explicit dependency graphs across primitives, blocks, pages, fonts, themes, and suite packages.
- A visual theme/workbench UI that edits token state through controlled schemas, not direct CSS string hacking.
- Runtime UI rendering through resident components and validated data payloads, not remote code injection.
- CLI install and update commands, plus MCP/discovery for coding agents.
- Regression checks for token contrast, semantic coverage, registry item schema validity, component import boundaries, and package install smoke paths.

For this project, the industry-standard shape should be sharpened into an opinionated Jami shape: fully tokenized, always live, overlay-bound configuration, suite-aware packages, and a registry item can be saved, named, duplicated, restored, exported, and registered without leaving the design-system workflow.

## Implementation Options

### Option A: Documentation-Only Registry Plan

Description: Keep the project as planning and research while implementation happens elsewhere.

When it fits: Only if `studio-ui-registry` is meant to be a planning archive.

Tradeoffs: Lowest immediate effort, but it fails the project goal. It would leave the registry, CLI, token engine, and suite packages without a canonical home.

Cost or operational impact: No new spend. High coordination cost later.

Reversibility: Easy to abandon, but not useful as the production path.

### Option B: Thin shadcn Registry

Description: Build a namespaced Jami shadcn registry for shared primitives, themes, and blocks, with minimal custom token tooling.

When it fits: If the goal is a useful installable component registry quickly.

Tradeoffs: Good developer experience, but insufficient for the stated product. It does not deliver the always-live token workbench, complete save/register flows, factory restore, suite recomposition, or exhaustive parameterization.

Cost or operational impact: Can host as static JSON and source packages with existing free/local tooling.

Reversibility: Good; it can become the foundation for Option C.

### Option C: Full Jami Studio Registry System

Description: Build the complete registry product: token compiler, theme workbench overlay, named presets, registry item packaging, suite taxonomy, CLI install/config flow, MCP discovery, Builder template recomposition, resident runtime renderer, and validation gates.

When it fits: This is the stated target.

Tradeoffs: More architecture and contract work upfront, but it avoids the false economy of building isolated components and retrofitting tokens, saves, install flows, and suite taxonomy later.

Cost or operational impact: Can stay within already approved sources by using local dev, static registry hosting, existing Vercel/GitHub paths, and no paid runtime dependency for the registry itself.

Reversibility: Strong if the token contract and registry item metadata stay provider-agnostic and generated outputs are treated as build artifacts.

### Option D: Agent-Native Fork First

Description: Fork Agent-Native immediately and extract the registry from the fork.

When it fits: If the first implementation goal is to customize Agent-Native apps, not build the registry as a standalone primitive product.

Tradeoffs: It accelerates app-level experimentation but risks letting template details define the registry contract. The better first-principles order is to define the token and registry contract first, then use Agent-Native templates as a recomposition corpus.

Cost or operational impact: No required paid spend, but higher dependency audit and fork maintenance cost.

Reversibility: Moderate; extracting clean packages after app-specific changes is harder than starting from a clean registry contract.

## Technical Implications

Architecture:

- The project should become a monorepo with at least `packages/tokens`, `packages/registry`, `packages/ui`, `packages/cli`, `packages/renderer`, and an app/workbench surface.
- Registry distribution and runtime rendering must stay separate. shadcn installs source. The renderer renders resident allowlisted components from validated payloads.
- Builder.io / Agent-Native templates should be imported as reference inputs, not copied wholesale without license and seam checks.

Data model:

- Token sets need stable IDs, human names, suite tags, registry package type, source lineage, draft state, saved state, factory source, and export metadata.
- Presets need user-owned editable copies and immutable factory definitions.
- Registry items need dependency graphs, compatibility generation, checksum/source identity, token requirements, suite membership, and docs payload.

API / contracts:

- The design workbench overlay should operate through a typed token contract and a save/register API.
- Registry output should produce valid `registry.json` and `registry-item.json` files.
- Runtime UI payloads should use a compact structured shape with component name, props, children, action refs, and vocabulary generation.

Security:

- Registry installation can write files, dependencies, and example env vars. The package contract must prohibit secrets in tracked registry items.
- Runtime UI payloads must never execute remote code. Unknown components and invalid props degrade gracefully.
- Third-party or user-authored iframe UI stays in an untrusted lane.

Tests:

- Token schema validation.
- Contrast and semantic token coverage.
- Registry item schema validation.
- CLI install smoke tests.
- Save, rename, duplicate, restore, export, and register flows.
- Runtime payload validation and fallback tests.

Performance:

- Token changes should update via CSS variables without component remount churn.
- The workbench should debounce expensive generation and persist only explicit save actions.
- Registry JSON should be cacheable and revision-addressable.

Deployment:

- Registry output can be statically hosted.
- The workbench app can deploy through the existing Vercel-friendly lane once a scaffold exists.
- CLI packages and registry source should remain installable locally without cloud-only dependencies.

## Project Implications

Scope:

- The product surface is larger than a component library: it includes registry authoring, token authoring, package generation, CLI install, suite curation, and runtime render contracts.

Sequencing:

- Engineering docs refresh first.
- Architecture and roadmap next.
- Token contract before visual theme presets.
- Registry package schema before component migration.
- Workbench shell before exhaustive controls.
- Builder template recomposition after the primitive and token contract is stable.

Ownership:

- `tokens` owns source truth and generated outputs.
- `registry` owns item metadata, dependency graph, and shadcn output.
- `ui` owns resident primitives and blocks.
- `renderer` owns runtime payload validation and rendering.
- `cli` owns install/config flows.
- `workbench` owns always-live overlay editing, status bar state, docked control panels, inspector focus, and save/register actions.

Docs:

- Current Intercal-specific engineering docs need a scoped refresh to `studio-ui-registry`.
- Durable docs should describe ownership and contracts, not dated task files.
- Roadmaps should avoid launch-stage language and describe the final production shape with sequenced workstreams.

Agent orchestration:

- Once roadmap work begins, subagents can split cleanly by contracts: tokens, registry schema, CLI, renderer, suite templates, workbench UX, docs/ops.

User-facing claims:

- Claims should be exact: installable shadcn-compatible registry, Jami token workbench overlay, suite packs, local-first authoring, always-live editing, explicit save, factory restore.
- Do not claim Builder template parity until each suite package is recomposed and install-smoked.

## Risks And Constraints

Code-owned risks:

- The repo has no app scaffold yet, so every package boundary still needs to be created.
- The engineering docs include stale codebase-specific references.
- A registry without a strict token source can drift into component-local styling; this must be prevented early.

External/provider risks:

- shadcn registry and CLI features move quickly. Pin CLI revisions in CI and record registry compatibility.
- Agent-Native package state and license scope need fork-time verification before lifting any source.
- Base UI and Radix choice affects every primitive's API shape.

Cost risks:

- No paid services are required for the registry foundation.
- The safest path uses local generation, static registry output, existing GitHub/Vercel lanes, and optional later package publishing.

Source/license risks:

- shadcn is MIT, but each lifted third-party template/source file must retain attribution and license notices.
- Builder.io / Agent-Native package and template license scopes must be verified before redistribution.

Migration risks:

- Rebuilding Agent-Native templates around the Jami registry is not a search-and-replace. Templates should be decomposed into suite patterns, blocks, and pages.
- Token migration should use generated outputs rather than manual CSS rewrites.

Verification scope:

- This pass verified local docs and official public docs, not live installs or package builds.
- The repo is not under Git in this checkout, so source-control validation is not available yet.

Assumptions:

- Existing approved free/local infrastructure is sufficient for planning, local builds, static registry output, and early hosted docs.
- Yrka remains the strongest layout and always-live-save reference unless you choose a different creative direction.

## Recommended Direction

Choose Option C: Full Jami Studio Registry System.

The exact shape should be:

- A Jami-owned shadcn-compatible registry with `@jami-studio` namespace.
- A DTCG-compatible token source model compiled to CSS variables, Tailwind theme variables, TypeScript types, shadcn `cssVars`, docs, and workbench controls.
- Eight factory Jami themes plus the default shadcn-style path, all editable through named user presets. The factory family should use soft warm muted tones, warm background colors, `#C14D84` as the likely main accent, and rich blue-green support shades rather than lime or yellow-green.
- Always-live theme editing: every control updates the UI immediately; Save persists; Restore returns to factory; Duplicate/Rename creates editable user presets; Register packages the selected theme/template/block/page for reuse.
- A workbench overlay with a compact status bar, collapsible docked control panels, optional inspector focus, retained site navigation, close/reopen behavior, and no controls sprawled across product pages.
- Four suite lanes: solo/general workflow, business ops, mixed-media, research/writing. Each suite owns primitives, blocks, page packs, app shells, empty/loading/error states, data-display patterns, agent surfaces, and template bundles.
- Builder.io / Agent-Native templates treated as a reference corpus to recompose into the Jami registry, not as untouched apps.
- Registry install/config flow from CLI with app selection, initial title/brand/theme, suite pack choices, optional defaults, and local config generation.
- Runtime renderer built from resident allowlisted components and validated structured payloads.

Why this is the right shape: it follows official current registry and token standards, uses the already-proven shadcn/Tailwind/Radix ecosystem, preserves long-term portability, avoids paid dependencies, and makes the design workbench the real product center instead of a decorative settings layer.

## Decision Points

### Primitive Base

Options:

- Option A: Radix-first shadcn base.
- Option B: Base UI-first shadcn base.
- Option C: Dual base families.

Tradeoffs:

- Option A: Best fit for current shadcn/Yrka/Agent-Native references and lowest recomposition risk.
- Option B: More aligned with newer Base UI ergonomics, but less aligned with local source patterns.
- Option C: Maximum breadth, higher maintenance and test matrix.

Recommendation: Option A.

Why: It matches the existing reference corpus and keeps the first registry generation focused.

Implication if different: Base UI-first or dual-base means the primitive manifest, docs, tests, and suite packages need a broader compatibility layer from the start.

### Token Source Format

Options:

- Option A: DTCG-compatible JSON source with generated outputs.
- Option B: CSS-only source.
- Option C: TypeScript-only source.

Tradeoffs:

- Option A: Best portability across code, design tools, docs, registry, and future platforms.
- Option B: Fast for web, weaker for typed controls and non-web outputs.
- Option C: Good developer ergonomics, weaker tool interoperability.

Recommendation: Option A.

Why: The product goal is adaptable, agnostic, and shareable; a standards-shaped token source is the correct root.

Implication if different: CSS-only or TypeScript-only narrows portability and makes future design-tool sync harder.

### Theme Editing Model

Options:

- Option A: Always-live workbench overlay with explicit save.
- Option B: Staged apply flow.
- Option C: Page-local controls.

Tradeoffs:

- Option A: Matches the requested workflow and Yrka reference; simple mental model; lets the real page remain the live subject while controls stay in the overlay.
- Option B: Adds unnecessary friction.
- Option C: Violates the panel-only configuration requirement and creates UI sprawl.

Recommendation: Option A.

Why: The UI should update immediately from token state. Save is persistence, not a separate apply action.

Implication if different: Staged or page-local controls would require extra state and contradict the desired product feel.

### Registry Hosting Shape

Options:

- Option A: Static registry JSON plus source packages.
- Option B: Dynamic registry API first.
- Option C: Private-only registry first.

Tradeoffs:

- Option A: Cheapest, simplest, shadcn-native, cacheable, easy for agents and CLI.
- Option B: More flexible for accounts and permissions, but unnecessary before package contracts exist.
- Option C: Useful later for private packs, but wrong as the public OSS foundation.

Recommendation: Option A.

Why: Official shadcn registry mechanics are static-friendly and match current cost constraints.

Implication if different: Dynamic/private-first requires auth, deployment, and account policy before the registry has proven its package contract.

### Suite Taxonomy

Options:

- Option A: Four first-class suite lanes: solo/general workflow, business ops, mixed-media, research/writing.
- Option B: Three first-class suite lanes without solo/general workflow.
- Option C: One flat library with tags.
- Option D: Separate registries per suite.

Tradeoffs:

- Option A: Matches product strategy while preserving shared primitives; gives jami.studio a natural showcase/demo install surface.
- Option B: Keeps the original three-suite concept but misses the lighter solo-founder/general workflow product lane.
- Option C: Simpler metadata, weaker product clarity.
- Option D: Strong isolation, higher duplication and drift risk.

Recommendation: Option A.

Why: Suites should own blocks/pages/templates, while primitives and tokens stay shared. The solo/general lane becomes the clean showcase and fast install path without dragging in deep employee, media, or research flows.

Implication if different: Removing the solo/general lane makes the public demo choose one heavy suite too early; flat tags reduce product coherence; separate registries increase maintenance.

### Package Naming

Options:

- Option A: One public `@jami-studio` namespace with suite identity in item names and metadata.
- Option B: Separate npm scopes or registry namespaces per suite.
- Option C: Brand aliases layered later over the same canonical namespace.

Tradeoffs:

- Option A: Best for MCP/CLI discovery, docs, package management, and registry simplicity.
- Option B: More brand separation, but more publishing overhead and more places for drift.
- Option C: Useful later if one suite becomes a separate product ecosystem, but premature before the registry contract is proven.

Recommendation: Option A now, with Option C reserved for later.

Why: `@jami-studio/ui`, `@jami-studio/tokens`, `@jami-studio/registry`, and `@jami-studio/cli` keep the package surface obvious. Registry items such as `@jami-studio/solo-suite`, `@jami-studio/business-ops-suite`, `@jami-studio/mixed-media-suite`, and `@jami-studio/research-writing-suite` are discoverable without multiplying namespaces.

Implication if different: Separate suite namespaces require extra publishing, docs, auth, and package-resolution policy from the start.

## Decision Questions For Discussion

1. Should the eight Jami factory themes all stay inside the warm rose/blue-green family, or should one or two themes intentionally stretch cooler/darker for media-heavy work?
2. Should each suite have a named visual identity inside one Jami family, or should all four suites share the same theme family and differ only by blocks/pages?
3. Should suite aliases wait until product names settle, or should aliases be reserved in metadata now while public packages stay under `@jami-studio`?
4. Should inspector mode be included in the first workbench overlay plan, or should the first overlay use status bar plus docked panels only?

## Next Step If Accepted

1. Refresh engineering docs to remove Intercal-specific codebase items while preserving the existing guidelines and flows.
2. Write the active roadmap under `docs/roadmaps/` from this report.
3. Create durable architecture docs for registry lifecycle, token contract, workbench overlay state, CLI/install flow, runtime renderer, and suite taxonomy.
4. Initialize source-control hygiene for this repo if this checkout is intended to become the active implementation repository.
5. Start implementation with the token contract and registry item schema before any component or template recomposition.

## Sources

Local:

- `docs/engineering/standards/report-style.md`
- `docs/engineering/standards/docs-standards.md`
- `docs/engineering/standards/planning-style.md`
- `docs/engineering/agents/goal.md`
- `docs/research/Rebuild.md`
- `docs/research/user-notes/goal.md`
- `docs/research/master/reports/B-agent-substrate/F09-ui-registry-and-render-seam.md`
- `docs/research/master/audits/12-agent-native/ui-registry-appearance.md`
- `docs/research/master/audits/12-agent-native/deep-dives/shadcn-as-agent-registry.md`
- `docs/research/master/audits/12-agent-native/recommendation.md`
- `C:\Users\james\projects\yrka\packages\design-tokens\src\business-theme-contract.ts`
- `C:\Users\james\projects\yrka\apps\web\lib\theme\workbench-contract.ts`
- `C:\Users\james\projects\yrka\apps\web\components\admin\dock\appearance-panel.tsx`

Official / external:

- https://ui.shadcn.com/docs/registry
- https://ui.shadcn.com/docs/registry/registry-item-json
- https://ui.shadcn.com/docs/registry/namespace
- https://ui.shadcn.com/docs/mcp
- https://ui.shadcn.com/docs/theming
- https://ui.shadcn.com/docs/changelog/2026-03-cli-v4
- https://ui.shadcn.com/docs/changelog/2026-04-partial-preset-apply
- https://tailwindcss.com/docs/theme
- https://www.w3.org/community/design-tokens/
- https://base-ui.com/react/overview/about
- https://www.agent-native.com/
- https://www.agent-native.com/docs

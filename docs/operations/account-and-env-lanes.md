# Account And Env Lanes

Status: Active setup reference
Last updated: 2026-06-07

## Purpose

This doc records safe account, CLI, and env-source status for agents working on Studio UI.
It must never contain secret values.

## Rules

- Do not paste secrets into docs, prompts, logs, registry items, generated artifacts, or
  screenshots.
- Use `.env.example` for tracked templates and `.env` / `.env.local` for local untracked
  runtime values.
- Existing env files under `C:\Users\james\dev` and related `james\dev\orgs` projects may
  be used as operator-approved source references, but agents must not copy secret values
  into tracked files.
- If a credential is needed, prefer setting it through the relevant CLI login, provider
  dashboard, local `.env`, Vercel env, GitHub secret, or other host secret store.

## Current CLI Status

Checked on 2026-06-07:

- GitHub CLI: authenticated to `github.com` as `jamesnavinhill`; token scopes include
  `repo`, `workflow`, `read:org`, and `gist`.
- GitHub remote: `https://github.com/JamiStudio/studio-ui.git` exists and is
  public.
- GitHub push status: `main` is pushed and tracking `origin/main`.
- Vercel CLI: authenticated as `studio-jami`.
- Vercel projects: none are required for `studio-ui` or `jami-harness`
  while they are package/source repos rather than deployed apps.
- Node: `v24.16.0`.
- pnpm: `10.33.2`.
- npm registry: `https://registry.npmjs.org/`.
- npm auth: not authenticated for `npm whoami`; run `npm adduser` or configure an npm
  automation token before package publishing.
- Wrangler: installed globally at `C:\nvm4w\nodejs\wrangler.cmd`; `wrangler --version`
  reports `4.98.0`.
- Wrangler auth: logged in with an OAuth token for `james@jami.studio`.
- Cloudflare account: `jami-studio`.

## Env Source References

Useful source lanes discovered locally:

- `C:\Users\james\dev\.env`
- `C:\Users\james\dev\orgs\oss\jami.studio\.env`
- `C:\Users\james\dev\orgs\oss\jami.studio\.env.example`
- `C:\Users\james\dev\orgs\oss\intercal.dev\.env`
- `C:\Users\james\dev\orgs\oss\intercal.dev\.env.example`
- `C:\Users\james\projects\yrka\.env.local`
- `C:\Users\james\projects\yrka\.env.example`
- `C:\Users\james\projects\references\rebuild\agent-primitives\agent-ui\.env`
- `C:\Users\james\projects\references\rebuild\agent-primitives\agent-ui\.env.example`

Treat these as references only. Copying a key into this repo must happen through local
`.env` or provider secret storage, not tracked docs.

## Package Publishing Setup

Before publishing npm packages:

1. Confirm package names and scope in the active roadmap or decision record.
2. Authenticate npm locally:

```powershell
npm adduser
npm whoami
```

3. Confirm package access policy for `@jami-studio/*`.
4. Store any automation token in the host secret store, not in tracked files.

## Registry Hosting Setup

The first registry hosting shape is static JSON plus source packages served from
`registry.jami.studio`.

- Preferred first target: Cloudflare Pages or equivalent Cloudflare static hosting under
  the existing `jami-studio` account.
- The hosted output comes from generated registry artifacts, not from a separate product
  app. Example paths: `/registry.json`, `/themes/<name>.json`,
  `/components/<name>.json`, `/suites/<name>.json`, and optional static assets.
- Vercel should be reserved for actual app surfaces when useful, such as a future
  `app.jami.studio` showcase/community app. It is not needed for repo-only placeholders.
- Use cache headers and revisioned item URLs once publishing starts.
- Private/authenticated registry lanes require a later operations doc and decision record.

## Cloudflare Setup

Cloudflare is not required for the initial local/static registry foundation. Current login
can be checked with:

```powershell
wrangler whoami
```

If the command requires authentication, run:

```powershell
wrangler login
```

Do not write Cloudflare tokens into tracked files.

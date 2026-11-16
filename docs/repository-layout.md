# Repository layout

The workspace separates the current browser editor and local Node service from the data and operations they share. It prepares for later UI changes and additional distribution targets without implementing desktop, hosted web, cloud sync, or a new storage format.

## Current ownership

```text
apps/
  web/
    src/                  React UI, hooks, browser persistence and MCP adapter
    index.html            Browser entry point
    vite.config.ts        Web root, shared public assets and private proxy
    dist/                 Generated browser build, ignored by Git
    CHANGELOG.md          Existing application release history
  local-service/
    src/                  Private broker, stdio MCP, durable JSON and native graphics
packages/
  document/src/           Layer, file, workspace and review schemas; IDs and migration
  engine/src/             Vanilla stores, edits, history, geometry and shared rendering
  mcp/src/                Tool/service schemas and handler factories
public/                   One copy of shipped fonts, licenses and favicon
scripts/                  Root lifecycle and import-boundary commands
```

Only real current boundaries are packages. There are no empty desktop, cloud, plugin, rendering, or storage packages. Rendering helpers remain inside the engine; native and browser implementations stay in their applications.

## Dependency direction

```text
web UI and browser MCP ─┐
                       ├─ mcp handlers ─ engine ─ document
local service / stdio ──┘         └─────────────── document
```

- `@open-cavas/document` depends only on Zod. It owns versioned data, validation, constructors, identity, review data, and legacy conversion. It does not import React, browser APIs, filesystem code, or either app.
- `@open-cavas/engine` depends on document exports and `zustand/vanilla`. It owns the shared validated state changes and bounded per-file history. Typography accepts an installed measurement adapter; the engine never creates DOM canvas elements or loads native graphics.
- `@open-cavas/mcp` depends on document, engine, and Zod. It owns the existing schemas and shared handlers. Factories receive a store, an inert HTML parser, or rendering functions as needed. They do not create a browser singleton at import time.
- `apps/web` owns React bindings, pending browser saves, IndexedDB recovery, URL navigation, browser font loading, DOMParser, PNG/PDF capture, and WebSocket registration.
- `apps/local-service` owns filesystem durability, broker authentication, native parsing/graphics, and stdio transport. It may import the root runtime settings used by the launchers. It does not import web source.
- The root `public/` directory is an intentionally shared build/runtime resource. Vite retains `/fonts/...` and `/favicon.svg`; native graphics loads the same font files from the snapshot. License notices stay beside the fonts.

Use package exports such as `@open-cavas/document/model` and `@open-cavas/engine/state`, not relative paths into another package's source. Imports inside one package remain relative. No TypeScript path aliases or compiled-package staging step are needed: Vite bundles source exports and tsx loads them for the service.

`pnpm run check` checks declared source dependencies with `scripts/check-boundaries.mjs`, then typechecks every package and root TypeScript tooling. Document, engine, and MCP typechecks use ES2022 without DOM libraries. The import check rejects undeclared dependencies, imports between applications, and dependencies from shared code back into applications. Keep Node and browser implementations at their existing runtime boundaries.

## Contributor commands

Use the pinned Node and pnpm versions. Run commands at the repository root:

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run changeset:status
```

`build` checks the whole workspace and writes only `apps/web/dist`. Native service source still runs with the existing tsx launcher. Dependencies are declared by the package that imports them; the root retains launcher and contributor tooling. No dependency versions change as part of the directory migration.

Feature development still requires a separate feature worktree and `pnpm run dev`. `mcp:config:dev`, `start`, `mcp:config`, release preparation, and service-management commands remain at the root. See [runtime profiles](runtime.md).

The app version and changelog now live in `apps/web`. Existing pending Changesets target `@open-cavas/web`; use that name for app release notes. This does not publish any package. See [versioning](versioning.md).

## Preserved contracts

This reorganization changes source ownership, not document or tool contracts:

- Existing document versions, IDs, JSON backups, review anchors, and legacy migration stay unchanged.
- Manual editing and both MCP targets use the same engine. Canvas revisions remain separate from durable workspace revisions.
- Browser saves retain the existing debounce, conflict handling, and service authority. No SQLite or asset migration occurs.
- The broker stays loopback-only with exact Origin/Host checks, one-use browser tickets, and private credentials. Mutations are never automatically replayed.
- Main stays on frontend 5182/private broker 4781; development defaults to 5188/4785. Private data stays under the root `.cavas/runtime` profile directory, outside release snapshots.
- Frozen releases install and build their own workspace. The main launcher reads their web configuration and output, never a feature worktree's build. Source builds do not deploy or restart main.

Rollback is a source/release-snapshot rollback, not a document downgrade. Older frozen snapshots retain their own launcher and dependency layout; new source launchers can still select an older snapshot. No saved workspace needs conversion.

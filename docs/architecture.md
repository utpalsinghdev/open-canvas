# Architecture

## Workspace boundaries

See [repository layout](repository-layout.md) for package ownership, dependency rules, and contributor commands. `apps/web` and `apps/local-service` are the current runtime adapters. `packages/document`, `packages/engine`, and `packages/mcp` share validated data and operations without importing either app. Desktop and hosted applications are not implemented.

## Modules

- `packages/document/src/model.ts` defines Zod schemas, inferred TypeScript types, constructors, IDs, bounds, and parent-aware visibility/locking. `packages/document/src/workspace.ts` owns file/workspace validation and legacy migration. `packages/engine/src/typography.ts` owns the font registry, requested/resolved status contract, and measured layout. `apps/web/src/editor/typography.ts` installs browser measurement and bundled-font loading; `apps/local-service/src/graphics.ts` installs native measurement.
- `packages/engine/src/seed.ts` creates original synthetic starter artwork.
- `packages/engine/src/state.ts` owns isolated vanilla Zustand stores, validated edits, selection, and tools. `workspace/actions.ts` owns file history and library operations. `apps/web/src/editor/store.ts` binds the browser singleton to React and review drafts; browser persistence stays in the web app.
- `packages/engine/src/geometry.ts` handles translation, local-axis resizing, and marquee intersections.
- `apps/web/src/editor/useCamera.ts` owns pan/zoom, pointer-anchored wheel zoom, and fit-to-visible-root bounds.
- `apps/web/src/editor/useShortcuts.ts` binds keyboard actions without intercepting text/form editing.
- `apps/web/src/editor/files.ts` validates file imports, reads safe raster images, serializes SVG, and triggers downloads. `apps/web/src/editor/pdf.ts` captures explicit artboard/page targets, validates resources and size budgets, rasterizes the shared SVG at 2×, and lazily loads pdf-lib to package lossless PNG pages with 96 px/in dimensions. `ExportMenu.tsx` provides the shared SVG/PDF header dropdown, explicit scope labels, and PDF pending/error feedback. See [PDF export](pdf-export.md).
- `apps/web/src/components/Canvas.tsx` renders SVG artboards, gesture previews, selection, resizing, and on-canvas text editing.
- `apps/web/src/components/Artwork.tsx` renders supported artwork independently of editor selection. `FilePreview.tsx` reuses its native node rendering for the remembered active page of each Home file, including parent visibility, text bounds, artboard clipping, opacity, and unique clip IDs. IntersectionObserver mounts artwork near the visible library area and unmounts it offscreen; narrow Home does not mount preview artwork. Preview rendering has no save, history, export, or MCP side effects.
- `apps/web/src/components/Layers.tsx`, `Inspector.tsx`, `Toolbar.tsx`, and `Help.tsx` provide editor controls.
- `apps/web/src/App.tsx` selects the Home/editor destination and owns shared JSON import and status feedback. `apps/web/src/EditorApp.tsx` connects canvas file actions, naming, and responsive panels. `apps/web/src/components/Projects.tsx` reuses one library implementation in Home and the editor dialog; `WorkspaceNotice.tsx` preserves save recovery in both destinations.
- `packages/document/src/review.ts` defines review schemas and copied thread identity. `packages/engine/src/review/anchors.ts` resolves anchors using measured text bounds; `actions.ts` commits thread/reply/status edits through file history. `apps/web/src/review/drafts.ts` retains session-only drafts by file/page/thread and protects them from MCP writes and automatic reloads.
- `apps/web/src/components/Reviews.tsx` renders canvas pins and the file-wide thread panel. Panel wheel events retain native scrolling rather than moving the camera. `packages/mcp/src/review-tools.ts` and `review-commands.ts` implement explicit-context list/read/status operations.

## Document and rendering

A versioned JSON document holds an ordered node list. Node kinds are artboard, rectangle, ellipse, text, and image. Only artboards can parent other nodes. Children use absolute world coordinates; moving or repositioning an artboard translates its children. Resizing an artboard changes the clipping frame without scaling its children.

Roots render in document order. Each artboard renders its background and then its children in document order, inside a clip path. Later siblings paint above earlier siblings. Bring to front and Send to back modify document order. Artboard opacity applies to its whole group. Parent visibility and locking affect children. Text layout measures with the resolved loaded font, then applies explicit line breaks, optional wrapping, tracking, line height, and fixed/auto-height/auto-width sizing. Missing legacy typography fields receive schema defaults. SVG embeds loaded bundled fonts; unavailable requested fonts remain in document data while rendering through the reported fallback. Browser fallback is Arial; backend fallback is bundled Inter when a system family is missing.

Rotated node bounds drive export/viewport fitting. Marquee uses unrotated node bounds and selects only non-artboard nodes; exact rotated-shape intersection is outside this MVP.

## State changes

1. A pointer gesture starts with document geometry and selected IDs.
2. Pointer moves update transient React preview state, not the document or undo history.
3. Pointer release creates a validated active-page mutation. Cancellation discards the preview.
4. Workspace actions replace that page inside its version-2 file and keep an immutable file snapshot in its own 80-entry history.
5. A 350 ms debounce sends the selected workspace to the private local service with its expected durable revision. Stale saves reject without replacing newer data.

Selection, tools, camera, and open panels are session state. File/page navigation clears selection, resets the tool, remounts pointer/text editing, and fits the new page. Reloading clears per-file histories. Imports and new files append library entries rather than overwriting the active file. Page changes, including deletion, use per-file history; project/file deletion is permanent and requires UI confirmation.

Every committed edit passes schema validation, including internal operations that could exceed geometry or layer limits. Failed changes display an error instead of introducing invalid state. Property fields commit on blur or Enter. Pointer capture retains gestures outside artwork; double-click uses a point hit-test because captured pointer events retarget the SVG root.

IDs use `crypto.getRandomValues`, which works on plain HTTP tailnet origins where `crypto.randomUUID` is not available.

## Persistence and boundaries

`packages/engine/src/state.ts` creates isolated vanilla editor stores shared by browser and backend. The React hook remains in `store.ts`. MCP handler factories accept a store and explicit runtime rendering/parser adapters. Importing them no longer creates a browser singleton or loads React. `apps/local-service/src/workspaces.ts` owns durable workspace records and a serialization queue; `workspace-storage.ts` validates and publishes private fsynced JSON snapshots. Browser copy is explicit and preserves identities; IndexedDB remains untouched as a recovery source.

`apps/web/src/workspace/persistence.ts` saves browser snapshots with durable expected revisions, polls idle tabs, preserves local navigation, and stops on stale writes without discarding unsaved work. Backend edits execute against an isolated page projection with explicit IDs, not the displayed browser page. Remote refresh clears stale undo history. See [local workspaces](local-workspaces.md) for complete storage, access, synchronization, recovery and lifecycle contracts.

## MCP control

`apps/local-service/src/index.ts` registers official-SDK stdio tools. `apps/local-service/src/broker.ts` owns an authenticated loopback WebSocket listener, up to eight automatically connected browser sessions, per-request correlation, 30-second deadlines, cancellation, and socket-bound responses. `apps/local-service/src/shared-broker.ts` validates owner metadata and authenticates secondary stdio clients against the same broker instance. Secondary shutdown does not stop the owner or remove its broker metadata. `apps/local-service/src/broker-session.ts` verifies identity before dispatch and recovers only through the existing exclusive listener and validated metadata paths. Workspace transport shares canvas error/deadline handling; failed dispatched commands are never replayed. The frontend supervisor recovers its own failed service child without discarding browser state. The Vite proxy forwards the private broker's WebSocket route. Its filesystem deny rules block `.cavas/**` and preserve Vite's existing secret-file protections. apps/local-service/src/browser-auth.ts issues short-lived one-use tickets to exact-Origin/Host same-origin POST requests. Upgrade consumes the ticket. The shared internal broker secret stays in ignored mode-0600 broker metadata and is never sent to browsers.

`packages/mcp/src/tools.ts` owns shared input schemas, tool descriptions, message schemas, and honest capability limits. `get_fonts` reports suggested/document families or explicitly queried families, with browser detection or native backend font-registry status; `get_node` adds resolved font availability, measured layout, and overflow for text. Typography edits use the same revision/context validation and history mutation path as other node properties. `apps/web/src/mcp/browser.ts` targets one browser instance and validates requests before dispatching `reads.ts` or `mutations.ts`. Mutations commit through the existing validated Zustand history, not a shadow document. Workspace/navigation/selection changes advance a session revision; exact expected revisions prevent stale writes. Page mutations also require the exact current project/file/page context. Explicit library operations receive project/file/page IDs and return the resulting context. Active manual edits block agent mutations. Responses distinguish current state from browser persistence status.

`packages/mcp/src/html.ts` parses a restricted inert HTML subset into native primitives without mounting elements, executing code, or fetching assets. `packages/engine/src/svg.ts` is the shared pure artwork serializer used by UI downloads and MCP exports. Browser PNG capture rasterizes that SVG in the connected canvas. Workspace-target capture uses native graphics in `apps/local-service/src/graphics.ts`, with bounded raster inputs/output, the shared typography/layout rules, directly loaded bundled fonts and explicit fallback metadata. No hidden browser is started. `html-parser.ts` adapters normalize browser DOMParser or backend parse5/CSSStyleDeclaration data into the same restricted layer converter. Tokens persist at file scope and are shared across its pages. Legacy version-1 documents still import with their token dictionary.

Read-back is the same state the user edits. The optional browser-routing path does not run the Mac helper, or claim a mutation timeout means failure. Disconnect/cancellation after dispatch reports unknown outcome and never retries a mutation automatically. Internal broker credentials rotate on owner startup and remain separate from browser registration. apps/web/src/mcp/connection.ts automatically retries only transport establishment; design commands are never replayed. AgentConnection offers opt-out, not a pairing form.


See [workspace.md](workspace.md) for the hierarchy, migration policy, deletion semantics, and backup format.


## Runtime release boundary

`scripts/runtime-settings.mjs` defines fixed main/development port pairs and independent private state directories. Vite and the MCP broker consume the same settings. `scripts/runtime.mjs` launches source/HMR only from feature worktrees; main resolves an immutable committed snapshot once. `scripts/release.mjs` builds Git HEAD with its own locked dependencies in `.cavas/releases/<commit>` and updates the main pointer after successful checks. A running main frontend or broker does not read development dist or node_modules. MCP capabilities and frontend metadata identify the active release. See runtime.md for the explicit restart and legacy migration steps.


## Safe frontend release updates

Vite emits runtime.json with the same main profile/commit as the HTML metadata. apps/web/src/editor/release-updates.ts polls this served manifest, not Git or a mutable release pointer. It runs only in a main page with a valid committed release ID. A workspace/store subscription and transport-level agentActivity track safe idle time. Pending saves, blocked persistence, pointer/text interactions, focused form controls, open dialogs, and in-flight agent requests prevent automatic reload. A fresh valid manifest is required before reloading; transient deployment failures retain local state. Normal reload reads the explicitly selected service workspace and automatically reconnects MCP with a new canvas ID. Session-only history is not migrated.

### Page request presence

`apps/web/src/mcp/page-activity.ts` resolves validated tool arguments to a page and keeps request-owned pending entries in a separate, non-persisted Zustand store. File-wide tools establish no page presence. `AgentActivity.tsx` compares complete project/file/page IDs with the displayed location and renders pointer-transparent editor chrome outside the artwork SVG. No presence state enters document history, JSON, SVG, or PNG output.

The browser gives pending status a bounded paint opportunity before invoking a page handler, then rechecks connection, revision, context, and manual-edit guards. Active-page reads reject navigation during that opportunity. Async visual exports capture their immutable page document before waiting for fonts, so navigation cannot silently retarget their artwork. Independent request cleanup, socket detach, a local deadline, and broker request-end messages clear pending presence without treating an uncertain mutation as a success or rollback. Fast calls retain a separate neutral recent-request receipt until 600 ms after dispatch, not a false pending label. Highlight animation begins bright and ends within 520 ms; long calls then remain static. The existing release-updater activity counter remains separate.

# Architecture

## Modules

- `src/editor/model.ts` defines Zod schemas, inferred TypeScript types, constructors, IDs, bounds, and parent-aware visibility/locking.
- `src/editor/seed.ts` creates original synthetic starter artwork.
- `src/editor/store.ts` owns the Zustand document, selection, active tool, bounded undo/redo snapshots, mutation validation, and local storage.
- `src/editor/geometry.ts` handles translation, local-axis resizing, and marquee intersections.
- `src/editor/useCamera.ts` owns pan/zoom, pointer-anchored wheel zoom, and fit-to-visible-root bounds.
- `src/editor/useShortcuts.ts` binds keyboard actions without intercepting text/form editing.
- `src/editor/files.ts` validates file imports, reads safe raster images, serializes SVG, and triggers downloads.
- `src/components/Canvas.tsx` renders SVG artboards, gesture previews, selection, resizing, and on-canvas text editing.
- `src/components/Artwork.tsx` renders supported artwork independently of editor selection.
- `src/components/Layers.tsx`, `Inspector.tsx`, `Toolbar.tsx`, and `Help.tsx` provide editor controls.
- `src/App.tsx` connects file actions, naming, responsive panels, and status feedback.

## Document and rendering

A versioned JSON document holds an ordered node list. Node kinds are artboard, rectangle, ellipse, text, and image. Only artboards can parent other nodes. Children use absolute world coordinates; moving or repositioning an artboard translates its children. Resizing an artboard changes the clipping frame without scaling its children.

Roots render in document order. Each artboard renders its background and then its children in document order, inside a clip path. Later siblings paint above earlier siblings. Bring to front and Send to back modify document order. Artboard opacity applies to its whole group. Parent visibility and locking affect children.

Rotated node bounds drive export/viewport fitting. Marquee uses unrotated node bounds and selects only non-artboard nodes; exact rotated-shape intersection is outside this MVP.

## State changes

1. A pointer gesture starts with document geometry and selected IDs.
2. Pointer moves update transient React preview state, not the document or undo history.
3. Pointer release creates a validated active-page mutation. Cancellation discards the preview.
4. Workspace actions replace that page inside its version-2 file and keep an immutable file snapshot in its own 80-entry history.
5. A 350 ms debounce queues an IndexedDB save of the workspace. The transaction compares the disk revision before replacing data.

Selection, tools, camera, and open panels are session state. File/page navigation clears selection, resets the tool, remounts pointer/text editing, and fits the new page. Reloading clears per-file histories. Imports and new files append library entries rather than overwriting the active file. Page changes, including deletion, use per-file history; project/file deletion is permanent and requires UI confirmation.

Every committed edit passes schema validation, including internal operations that could exceed geometry or layer limits. Failed changes display an error instead of introducing invalid state. Property fields commit on blur or Enter. Pointer capture retains gestures outside artwork; double-click uses a point hit-test because captured pointer events retarget the SVG root.

IDs use `crypto.getRandomValues`, which works on plain HTTP tailnet origins where `crypto.randomUUID` is not available.

## Persistence and boundaries

IndexedDB database `open-cavas`, object store `workspace`, key `current` holds the validated workspace, navigation location, and disk revision. A missing record permits migration from `open-cavas.document.v1`; the original local-storage key is never removed. Corrupt/unavailable storage leaves fallback work in memory with saving blocked and a backup warning. It never silently resets or overwrites saved data.

`src/workspace/model.ts` owns project/file/page schemas and backward-compatible legacy conversion. The editor's version-1-shaped `document` is an active-page projection only. Version-2 file documents contain all pages and file-wide tokens. `state.ts` derives the projection and session history from the canonical workspace. `actions.ts` validates and updates library/file/page state. `storage.ts` owns IndexedDB transactions; `persistence.ts` serializes saves and status updates.

A save reads the stored revision inside the same read-write transaction as its put. A different revision aborts the transaction and blocks further writes in that tab. This prevents two tabs from silently replacing one another's workspace; it does not merge edits. Save status becomes `saved` only if the committed snapshot is still current in memory. Visibility/pagehide events request a flush, but asynchronous completion before tab termination is not guaranteed.

JSON backups can represent files, projects, or the complete workspace. Imports validate every page and parent relationship, regenerate project/file IDs, and append items. Files are limited to 100 pages and 10,000 layers, with 1,000 layers per page. History is in memory per file. Pure SVG serialization and screenshots use only the active page. JSON file export includes all pages.

No account, analytics, or cloud document storage is used. Raster images remain embedded data URLs. Local data belongs to the browser origin; switching port or hostname selects a different storage namespace. No automatic cross-origin transfer occurs. Browser cleanup or quota errors require downloaded backups for recovery.


## MCP control

`server/index.ts` registers official-SDK stdio tools. `server/broker.ts` owns an authenticated loopback WebSocket listener, up to eight paired browser sessions, per-request correlation, 30-second deadlines, cancellation, and socket-bound responses. `server/shared-broker.ts` validates owner metadata and authenticates secondary stdio clients against the same broker instance. Secondary shutdown does not stop the owner or remove its pairing file. The Vite proxy forwards the private broker's WebSocket route. Its filesystem deny rules block `.cavas/**` and preserve Vite's existing secret-file protections. Codes and allowed Origin are checked before upgrade; codes live only in an ignored mode-0600 pairing file and browser memory.

`src/mcp/tools.ts` owns shared input schemas, tool descriptions, message schemas, and honest capability limits. `src/mcp/browser.ts` targets one browser instance and validates requests before dispatching `reads.ts` or `mutations.ts`. Mutations commit through the existing validated Zustand history, not a shadow document. Workspace/navigation/selection changes advance a session revision; exact expected revisions prevent stale writes. Page mutations also require the exact current project/file/page context. Explicit library operations receive project/file/page IDs and return the resulting context. Active manual edits block agent mutations. Responses distinguish current state from browser persistence status.

`src/mcp/html.ts` parses a restricted inert HTML subset into native primitives without mounting elements, executing code, or fetching assets. `src/editor/svg.ts` is the shared pure artwork serializer used by UI downloads and MCP exports. PNG capture rasterizes its SVG in the paired browser. Tokens persist at file scope and are shared across its pages. Legacy version-1 documents still import with their token dictionary.

Read-back is the same state the user edits. The server does not retain documents, run the Mac helper, or claim a mutation timeout means failure. Disconnect/cancellation after dispatch reports unknown outcome and never retries a mutation automatically. Pairing codes are rotated on process startup, never stored in document JSON, and removed on normal shutdown.


See [workspace.md](workspace.md) for the hierarchy, migration policy, deletion semantics, and backup format.


## Runtime release boundary

`scripts/runtime-settings.mjs` defines fixed main/development port pairs and independent private state directories. Vite and the MCP broker consume the same settings. `scripts/runtime.mjs` launches source/HMR only from feature worktrees; main resolves an immutable committed snapshot once. `scripts/release.mjs` builds Git HEAD with its own locked dependencies in `.cavas/releases/<commit>` and updates the main pointer after successful checks. A running main frontend or broker does not read development dist or node_modules. MCP capabilities and frontend metadata identify the active release. See runtime.md for the explicit restart and legacy migration steps.

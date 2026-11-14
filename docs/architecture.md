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
3. Pointer release creates a single validated document mutation. Cancellation discards the preview.
4. Zustand stores the previous immutable document in a capped 80-entry history and clears redo.
5. A 350 ms debounce writes the document to local storage. Pending writes flush on pagehide.

Selection, tools, camera, and open panels are session state. Reloading clears history. Stored data is parsed with Zod before use. Import and creation replace the current document through ordinary history, so users can undo those operations.

Every committed edit passes schema validation, including internal operations that could exceed geometry or layer limits. Failed changes display an error instead of introducing invalid state. Property fields commit on blur or Enter. Pointer capture retains gestures outside artwork; double-click uses a point hit-test because captured pointer events retarget the SVG root.

IDs use `crypto.getRandomValues`, which works on plain HTTP tailnet origins where `crypto.randomUUID` is not available.

## Persistence and boundaries

Local storage key: `open-cavas.document.v1`. No account, API, analytics, or document upload service is used. Raster images embed as data URLs. The first load creates starter artwork when no valid saved document exists. Corrupt stored data produces a warning and is not overwritten unless the user edits.

JSON downloads are the portable document format. SVG is a visual export with XML-escaped text, safe raster data URLs, and generated clip IDs. The renderer and serializer intentionally support the same small set of primitives. Imported HTML, scripts, external image URLs, and SVG image payloads are not allowed.

Local storage quota failure leaves the in-memory document usable and displays a backup instruction. It does not mean the document is durable. File downloads and browser backup remain necessary.

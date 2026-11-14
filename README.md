# Open Cavas

A local-first web design editor. Create artboards, arrange text, shapes, and images, then export SVG or download an editable JSON document. No account or backend required.

## Run

Use Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open **http://localmachine:5178** on the home-server tailnet. The development server binds `0.0.0.0`, uses port 5178, and refuses to silently switch ports. On another host, use that host's address. This is a development server without authentication, not a production deployment. Do not forward it to the public internet.

```sh
npm run check   # TypeScript
npm run build   # TypeScript and production bundle
npm run preview # Serve dist on port 5178, after stopping this project's dev server
```

## Editor

- **Create:** choose Artboard, Rectangle, Ellipse, or Text, then click for a default size or drag to set dimensions. Add image accepts PNG, JPEG, WebP, or GIF up to 2 MB.
- **Select:** click artwork or a layer. Shift-click adds or removes layers. Drag empty canvas for a marquee selection of non-artboard layers.
- **Edit:** drag to move, use corner handles to resize, or enter exact values in Properties. Double-click text for on-canvas editing. Ctrl/Cmd+Enter or blur commits text; Escape cancels the on-canvas edit.
- **Organize:** rename, hide, lock, duplicate, delete, reorder, or change a layer's parent artboard. Moving an artboard moves its children; resizing an artboard changes its clipping area, not its children's scale.
- **Navigate:** hold Space and drag to pan. Scroll pans, Ctrl/Cmd+scroll zooms around the pointer. Zoom buttons and Fit canvas are at the bottom right.
- **History:** undo and redo apply to document edits. A completed drag is one history entry. Camera movement is not part of undo history.
- **Files:** File menu opens JSON, creates an empty document, renames, or downloads JSON. Export SVG exports the selected artboard when exactly one artboard is selected; otherwise it exports the visible document.

Press `?` by clicking the help button for the complete shortcut list. On narrow screens, use Layers and Properties buttons to open panels.

## Keep your work

Edits save to this browser's local storage after 350 ms. Storage is specific to the browser and origin. It is not cloud sync. Private browsing, browser cleanup, storage limits, or a different hostname can make saved work unavailable. Watch for save errors and **download JSON backups**. Image-heavy files can exceed browser quotas even below the document layer limit.

JSON import validates the version, layer types, geometry, IDs, parent references, and raster data URLs. Invalid imports leave the current document unchanged. Opening or creating a document is undoable during the current session. Reloading clears undo history.

## MVP limits

- One document and one page at a time, at most 1,000 layers, 80 undo snapshots.
- JSON imports up to 12 MB; raster images up to 2 MB each. Browser storage may have a smaller total quota.
- Only artboards are containers. Children use absolute world coordinates and clip to their artboard.
- Text uses explicit line breaks, not automatic wrapping. Font availability follows the browser's system fonts.
- SVG export preserves supported artwork, clipping, rotation, opacity, and embedded images. It does not include editor chrome. It is a visual export, not a JSON round trip.
- No third-party editable design document compatibility, arbitrary HTML import, HTML/CSS code generation, cloud sync, multiplayer, AI, vector paths, grouping, auto layout, snapping, or PNG/PDF export.
- Desktop mouse/keyboard is the primary workflow. Mobile has responsive controls and panel access; multi-touch/pinch gestures are not implemented.

## Project docs

- [Product scope](PRODUCT.md)
- [Engineering rules](AGENTS.md) and [agent.md alias](agent.md)
- [Architecture and state flow](docs/architecture.md)
- [Document format](docs/document-format.md)
- [Verification record](docs/verification.md)
- [Design system](DESIGN.md)

The starter composition is original editable demonstration content.

# Open Cavas

A local-first web design editor inspired by Paper. Create artboards, arrange text, shapes, and images, then export SVG or download an editable JSON document. No account or Paper installation required. Manual editing is browser-only; optional MCP control runs a local bridge.

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

## Agent control through MCP

This branch includes a stdio MCP server with 44 tools for live document reads, artboard/layer creation, editing, selection, tokens, restricted HTML import, exports, and artwork screenshots.

Start `npm run dev:agent` and open **http://localmachine:5182**. Generate its configuration with `npm run --silent mcp:config` or use [mcp.example.json](mcp.example.json), launch its MCP connection, then run `npm run mcp:pair` and enter the private code through **Connect agent** in the app. No global agent configuration is modified automatically.

Read [MCP setup and security](docs/mcp.md) and [capability coverage](docs/mcp-capabilities.md). A paired browser must remain open. This is not complete Paper MCP parity.

## Editor

- **Create:** choose Artboard, Rectangle, Ellipse, or Text, then click for a default size or drag to set dimensions. Add image accepts PNG, JPEG, WebP, or GIF up to 2 MB.
- **Select:** click artwork or a layer. Shift-click adds or removes layers. Drag empty canvas for a marquee selection of non-artboard layers.
- **Edit:** drag to move, use corner handles to resize, or enter exact values in Properties. Double-click text for on-canvas editing. Ctrl/Cmd+Enter or blur commits text; Escape cancels the on-canvas edit.
- **Organize:** rename, hide, lock, duplicate, delete, reorder, or change a layer's parent artboard. Moving an artboard moves its children; resizing an artboard changes its clipping area, not its children's scale.
- **Navigate:** hold Space and drag to pan. Scroll pans, Ctrl/Cmd+scroll zooms around the pointer. Zoom buttons and Fit canvas are at the bottom right.
- **History:** undo and redo belong to each file, including all its pages. Switching files preserves separate histories during this session. A completed drag is one history entry. Camera and page navigation are not undo steps.
- **Files:** File menu imports JSON as a new file, creates a new file in the current project, renames, or downloads the complete multi-page file. Export SVG exports the selected artboard when exactly one is selected; otherwise it exports the active page.

Click the help button for the complete shortcut list. On narrow screens, use Layers and Properties buttons to open panels.

## Projects, files, and pages

Click the project name beside the header wordmark to open Projects. Create or rename projects, search/open/create/rename/duplicate files, and download file/project/workspace backups. Each project always contains at least one file. Project and file deletion require confirmation and are permanent, including their history. Download backups first.

Use Pages above Layers to add, rename, duplicate, delete, or switch pages in a file. Each file keeps at least one page. Page duplication assigns new page/layer IDs. Page deletion can be undone through that file's history. Files share no artwork or undo state; design tokens are shared across pages of the same file.

The first upgrade migrates the old single canvas into a **Personal** project, one file, and **Page 1**. Original local-storage data stays untouched as a fallback backup. Migration runs only when no IndexedDB workspace exists.

## Keep your work

The complete workspace saves to IndexedDB in this browser origin after a 350 ms debounce. This is not cloud sync. The browser, hostname, port, profile, private-browsing state, cleanup, and storage quota determine which workspace is available. Different app ports do not share storage. Watch the header save status and **download JSON backups** from Projects.

File backups include every page and file token. Project backups include every file in that project. Workspace backups include all projects. Import accepts legacy version-1 documents, version-2 multi-page files, project backups, and workspace backups. It adds new items without replacing existing work. Imported project/file IDs are regenerated to prevent collisions. Invalid imports commit nothing.

Edits are usable immediately in memory; `Saved locally` appears only after an IndexedDB transaction completes. Closing a tab before a pending save finishes can still lose recent work. Reloading clears undo history, not saved projects/pages. Failed or corrupt workspace loads never overwrite the stored workspace automatically.

Multiple tabs do not merge work. Each save compares the stored revision inside its write transaction. If another tab has saved first, the stale tab stops saving and shows a conflict. Download a workspace backup from that tab, then reload before continuing. This prevents silent overwrites, not multiplayer collaboration.

## MVP limits

- Up to 50 projects, 50 files per project, and 200 files total. Up to 100 pages per file, 1,000 layers per page, and 10,000 layers per file. One page is active at a time. Each file keeps at most 80 undo snapshots in memory.
- UI JSON imports up to 40 MB; MCP messages remain limited to 12 MB; raster images up to 2 MB each. Browser storage may have a smaller total quota.
- Only artboards are containers. Children use absolute world coordinates and clip to their artboard.
- Text uses explicit line breaks, not automatic wrapping. Font availability follows the browser's system fonts.
- SVG export preserves supported artwork, clipping, rotation, opacity, and embedded images. It does not include editor chrome. It is a visual export, not a JSON round trip.
- No Paper document compatibility, arbitrary HTML/CSS layout import, semantic application code generation, cloud sync, multiplayer, AI, vector paths, grouping, auto layout, snapping, or PDF export. MCP adds restricted static HTML import, SVG-based HTML/JSX output, and artwork PNG capture.
- Desktop mouse/keyboard is the primary workflow. Mobile has responsive controls and panel access; multi-touch/pinch gestures are not implemented.

## Project docs

- [Product scope](PRODUCT.md)
- [Engineering rules](AGENTS.md) and [agent.md alias](agent.md)
- [Architecture and state flow](docs/architecture.md)
- [Projects, files, and persistence](docs/workspace.md)
- [Document format](docs/document-format.md)
- [Paper investigation and limits](docs/paper-research.md)
- [Verification record](docs/verification.md)
- [Design system](DESIGN.md)
- [MCP setup](docs/mcp.md) and [coverage](docs/mcp-capabilities.md)

The starter composition is original editable demonstration content. Paper's name is used only as a reference. No Paper source, assets, or private documents are distributed.

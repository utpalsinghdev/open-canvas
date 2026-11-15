# Open Cavas

A local-first web design editor. Create artboards, arrange text, shapes, and images, then export SVG/PDF or download an editable JSON document. No account required. Manual editing is browser-only; optional MCP control runs a local bridge.

## Run stable main

Use Node.js 22+ and npm, in the primary main checkout.

```sh
npm ci
npm run release:main  # Requires clean committed main; builds a frozen snapshot
npm run service:install # Persistent main frontend at http://localmachine:5182
# npm start remains available for manual foreground use
```

Main MCP uses private loopback port **4781**. Generate its config with `npm run --silent mcp:config`, start/reconnect your agent, and select an explicit workspace with `list_workspaces`. Data operations do not need an open browser. Browser rendering connects automatically when the application is open. No pairing code or click is required. A running main release is unaffected by feature builds. The Linux user service keeps it alive independently of agent sessions and restarts it after failures.

## Versions and changelog

Use `npm run changeset` to record a feature/fix and its patch/minor/major bump. Commit that Markdown entry with the change. `npm run changeset:status` shows pending releases. Before an authorized release, `npm run version:apply` consumes entries, updates package versions and the lockfile, and generates `CHANGELOG.md`. Review and commit the result before `npm run release:main`.

The app stays private. Versioning does not publish to npm, create tags, deploy, or restart main automatically. Detailed workflow is in [docs/versioning.md](docs/versioning.md).

## Feature development

Use a feature branch in a separate worktree:

```sh
npm ci
npm run dev                        # http://localmachine:5188
npm run --silent mcp:config:dev     # Separate development agent entry
npm run build                      # TypeScript and source bundle; not a main release
```

The development launcher rejects main branches and the primary checkout. Main ports are reserved, not reused when busy. Main/dev broker credentials and browser workspaces are separate. Application listeners bind `0.0.0.0`; private brokers remain loopback-only. These are trusted-network local services, not an authenticated public deployment.

After feature verification and authorized merge, run `npm run release:main` and deliberately restart main. Main browser tabs detect new releases and refresh automatically when saved and idle; active edits or failed saves delay refresh. No automatic restart, publish, or global MCP configuration change occurs. See [runtime and release workflow](docs/runtime.md), [MCP setup/security](docs/mcp.md), and [capability coverage](docs/mcp-capabilities.md).

## Agent control through MCP

51 tools provide local workspace discovery/creation, document reads, artboard/layer creation, editing, selection, tokens, restricted HTML import, exports, and artwork screenshots. Use an explicit `workspaceId` for browser-independent data operations. Screenshots, HTML import, and visual exports still need an explicit connected `canvasId`.

## Editor

- **Create:** choose Artboard, Rectangle, Ellipse, or Text, then click for a default size or drag to set dimensions. Add image accepts PNG, JPEG, WebP, or GIF up to 2 MB.
- **Select:** click artwork or a layer. Shift-click adds or removes layers. Drag empty canvas for a marquee selection of non-artboard layers.
- **Edit:** drag to move, use corner handles to resize, or enter exact values in Properties. Double-click text for on-canvas editing. Ctrl/Cmd+Enter or blur commits text; Escape cancels the on-canvas edit.
- **Organize:** rename, hide, lock, duplicate, delete, reorder, or change a layer's parent artboard. Moving an artboard moves its children; resizing an artboard changes its clipping area, not its children's scale. Use Collapse all in Layers to fold every artboard branch on the current page without changing selection or artwork. Individual arrows reopen branches. Collapse state is session-only.
- **Navigate:** hold Space and drag to pan, choose Hand, or drag with the middle mouse button. Scroll pans, Ctrl/Cmd+scroll zooms around the pointer. Zoom buttons and Fit canvas are at the bottom right.
- **Cursors:** Select, Hand, Text, and directional resize handles use a matching 32 px SVG cursor set with dark ink and white contrast rims. Select uses an arrow, Text an I-beam, and Artboard, Rectangle, and Ellipse the native crosshair. Hand and Space show an open hand; an active pan shows a closed hand. Each cursor has a native fallback. Inline text editing keeps its native text cursor; panels and controls retain their normal cursors.
- **History:** undo and redo belong to each file, including all its pages. Switching files preserves separate histories during this session. A completed drag is one history entry. Camera and page navigation are not undo steps.
- **Files:** File menu imports JSON as a new file, creates a new file in the current project, renames, or downloads the complete multi-page file. Export SVG exports the selected artboard when exactly one is selected; otherwise it exports the active page. Export artboards PDF puts selected artboards into one PDF in document order, one artboard per page. With no artboards selected, Export page PDF explicitly exports the active page as one page. See [PDF export](docs/pdf-export.md) for dimensions and limits.

Click the help button for the complete shortcut list. On desktop, use the sidebar icons at the left and right ends of the toolbar row to collapse or reopen Layers and Properties independently. Both can be collapsed for more canvas space. Selection and panel content stay intact; visibility resets on reload. On narrow screens, use Layers and Properties buttons to open one overlay at a time.

## Projects, files, and pages

Click the project name beside the header wordmark to open Projects. Create or rename projects, search/open/create/rename/duplicate files, and download file/project/workspace backups. Each project always contains at least one file. Project and file deletion require confirmation and are permanent, including their history. Download backups first.

Use Pages above Layers to add, rename, duplicate, delete, or switch pages in a file. Each file keeps at least one page. Page duplication assigns new page/layer IDs. Page deletion can be undone through that file's history. Files share no artwork or undo state; design tokens are shared across pages of the same file.

The first upgrade migrates the old single canvas into a **Personal** project, one file, and **Page 1**. Original local-storage data stays untouched as a fallback backup. Migration runs only when no IndexedDB workspace exists.

## Review feedback

Choose **Comment** beside the drawing tools, click a layer or canvas position, then write feedback. Open **Comments** to browse page-aware threads. Read and reply to threads, navigate to their targets across pages, and resolve or reopen them. Posted feedback stays in local storage and complete JSON backups. MCP can list/read threads and change their status with explicit page context and revision checks. See [review threads](docs/review-threads.md) for controls, draft behavior, limits, and missing-anchor rules.

## Keep your work

Select a local service workspace on first load. **Copy browser workspace** explicitly transfers existing IndexedDB artwork into a new workspace without changing IDs or touching the original browser data. No profiles or origins merge automatically. Download backups before migrating valuable work.

The local service owns durable documents. Browser edits save after a 350 ms debounce; workspace-target MCP mutations acknowledge completed durable writes. Idle browsers refresh remote changes without following agent navigation. Stale writes stop instead of replacing newer work. Download a workspace backup before reloading a conflicted tab. Incoming changes clear obsolete undo history.

File/project/workspace JSON backups and append-only imports remain available through Projects. Closing a tab before its pending save finishes can still lose recent browser edits. Keep downloaded backups. See [local workspaces](docs/local-workspaces.md) for storage, migration, concurrency, lifecycle, authentication, and recovery limits.

## MVP limits

- Up to 50 projects, 50 files per project, and 200 files total. Up to 100 pages per file, 1,000 layers per page, and 10,000 layers per file. One page is active at a time. Each file keeps at most 80 undo snapshots in memory.
- UI JSON imports up to 40 MB; MCP messages remain limited to 12 MB; raster images up to 2 MB each. Browser storage may have a smaller total quota.
- Only artboards are containers. Children use absolute world coordinates and clip to their artboard.
- Text supports bundled Inter and Bricolage Grotesque variable fonts (including weight 620), Arial/Georgia/Courier New system fonts, line height, tracking, alignment, optional measured wrapping, and fixed/auto-height/auto-width sizing. Requested/resolved font availability and measured overflow are visible in Properties and MCP reads. Older files default safely to prior typography behavior.
- SVG export preserves supported artwork, clipping, rotation, opacity, embedded images, and loaded bundled typography fonts. It does not include editor chrome. It is a visual export, not a JSON round trip.
- No third-party editable design document compatibility, arbitrary HTML/CSS layout import, semantic application code generation, cloud sync, multiplayer, AI, vector paths, grouping, auto layout, or snapping. MCP adds restricted static HTML import, SVG-based HTML/JSX output, and artwork PNG capture.
- PDF export is lossless 2× raster artwork, not selectable text or PDF vectors. It uses 96 px/in dimensions, white page backgrounds, and bounded page/pixel/file sizes. GIF, animated PNG/WebP, corrupt images, and unavailable bundled fonts fail explicitly. See [PDF export](docs/pdf-export.md).
- Desktop mouse/keyboard is the primary workflow. Mobile has responsive controls and panel access; multi-touch/pinch gestures are not implemented.

## Project docs

- [Product scope](PRODUCT.md)
- [Engineering rules](AGENTS.md) and [agent.md alias](agent.md)
- [Runtime profiles and main releases](docs/runtime.md)
- [Architecture and state flow](docs/architecture.md)
- [Projects, files, and persistence](docs/workspace.md)
- [Browser-independent local workspaces](docs/local-workspaces.md)
- [Document format](docs/document-format.md)
- [Verification record](docs/verification.md)
- [Design system](DESIGN.md)
- [MCP setup](docs/mcp.md) and [coverage](docs/mcp-capabilities.md)

The starter composition is original editable demonstration content.


## Automatic agent connection

Opening Open Cavas automatically makes that tab available to trusted local MCP agents. Blue dots above the page artwork indicate a pending page-specific request, not an idle connection or an entire task. They appear with a short staggered entrance, stay static, and respect reduced motion. If the broker starts later or restarts, the browser reconnects automatically without replaying design writes. Use Pause agent access in the File menu to disable this tab until resumed or reloaded.

Workspace data still lives in the browser, not the MCP server. `list_canvases` is empty when no application tabs are open or all tabs are paused. Reload an older pre-upgrade tab once to load automatic connection. Agent access is implicit when opening the app; keep the app on a trusted network and do not host untrusted scripts on its origin.

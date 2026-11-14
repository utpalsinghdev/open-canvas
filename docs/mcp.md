# Agent control through MCP

Open Cavas exposes 44 tools over the official MCP SDK's stdio transport. It controls a paired Open Cavas browser directly. It does not connect to Paper, the old Mac helper, or Paper's official MCP service.

## Start and pair

Use the fixed runtime profiles described in [runtime.md](runtime.md).

**Main:** frontend http://localmachine:5182, private broker 127.0.0.1:4781. Prepare a committed snapshot with `npm run release:main`, serve it with `npm start`, and generate the main agent configuration:

```sh
npm run --silent mcp:config
```

Copy its `open-cavas` entry into the agent configuration, start/reconnect that client, then run `npm run mcp:pair`. Paste the private code through **Connect agent**. Generated config points at the stable main launcher and its selected release, not a development worktree. No global settings are edited automatically.

**Development:** from a feature branch in a separate worktree, run `npm run dev`. Frontend is http://localmachine:5188 and broker is 127.0.0.1:4785. Generate its distinct agent entry with `npm run --silent mcp:config:dev`, and read its code with `npm run mcp:pair:dev`. Development refuses reserved main ports. Additional worktrees require explicit unused dev port pairs.

Codes grant document read/write access. Never place them in URLs, public files, VITE-prefixed variables, chat, screenshots, or committed config. Main metadata is `.cavas/runtime/main/5182-4781/pairing.json`; dev is `.cavas/runtime/dev/5188-4785/pairing.json` in its own checkout. Files are mode 0600 inside private directories. Main code snapshots share only their main runtime directory so clients on the same release can attach to the owner.

Broker upgrades require the code, exact Origin, and explicit browser protocol. Vite denies `.cavas/**`, including filesystem aliases, and proxies the authenticated broker route. App listeners bind 0.0.0.0 on a trusted network; brokers stay loopback-only. No unauthenticated HTTP MCP API is exposed.

One process owns each profile's broker. Later clients authenticate and attach; they do not rotate its code or stop the owner. Keep the owner alive. Browser reload or owner restart disconnects pairing, requiring re-pairing and fresh IDs/state reads. See [multiple sessions](mcp-multi-session.md).

Main release publication builds a snapshot without changing running processes. After merge, a deliberate frontend/broker restart makes the new release active. Reconnect agents together and compare `get_capabilities.runtime.release` with the frontend `cavas-release` meta tag. Legacy direct-source clients must be reconfigured/restarted once; they are not silently migrated or killed.

## Agent workflow

1. Call `get_capabilities`, then `list_canvases`.
2. Choose an explicit canvas ID. Never infer which browser tab the user intends.
3. Read `get_document`, `get_tree`, `get_node`, or `get_selection`.
4. Supply that response's `revision` as `expectedRevision` on every mutation. Page/content mutations also require its exact `context` object containing projectId, fileId, and pageId.
5. Read the relevant node/tree after changing it. Tool success is not a screenshot or proof of durable browser storage.
6. Use `get_screenshot` to inspect artwork or an artboard when visual confirmation matters.

Selection, workspace edits, and file/page navigation advance the revision. Manual browser edits advance it too. Stale mutations fail without changing state. A manually active drag, on-canvas text edit, or focused inspector/document-name field blocks agent writes until the user finishes or cancels the edit.

Each atomic content/page mutation is one file-specific undo step. Selection changes are separate session state. Read responses and edit receipts include a persistence state, `saved`, `pending`, or `failed`. A `pending` receipt means the document is in memory, not yet durably written. Download JSON backups.

There is no automatic mutation retry. Cancellation, timeout, or disconnection after dispatch can leave the outcome unknown. Reconnect and inspect actual state before deciding whether to repeat an operation. Late responses cannot satisfy another request or another tab's pending call.

## Tools

### Discovery and read-back

`get_capabilities`, `list_canvases`, `get_document`, `get_tree`, `get_node`, `get_styles`, `get_selection`.

By default document/node/style reads omit base64 image bytes. Such abbreviated document responses are not lossless import files. Use `export_document` with format `json`, or explicitly request images in `get_document`, for a complete document. Stable node IDs survive JSON export/import and browser reload; canvas IDs do not.

### Creation and editing

`select_nodes`, `create_artboard`, `create_nodes`, `update_nodes`, `set_text`, `move_nodes`, `duplicate_nodes`, `delete_nodes`, `reorder_nodes`, `undo`, `redo`.

Coordinates are absolute world pixels, including when a parent is supplied. Only artboards can parent nodes. Creating or moving an artboard follows the same editor rules as manual editing. Locked targets reject agent changes, except a direct unlock. Batches validate before committing, so a malformed entry cannot partially update a document. `create_nodes` accepts at most 100 layers per call.

### Documents and output

`rename_document`, `create_document`, `open_document`, `export_document`, `get_screenshot`.

New/open operations add a new file to the active project and keep existing work. `open_document` accepts either a legacy version-1 document or a complete version-2 multi-page file. Use `open_file` to navigate to an existing file/page. JSON export returns the complete active file; visual exports use only the active page or a selected artboard. Exports do not write server-side filesystem paths.

### Project/file/page lifecycle

`list_projects`, `get_file`, `list_pages`, `create_project`, `rename_project`, `delete_project`, `create_file`, `rename_file`, `delete_file`, `duplicate_file`, `open_file`, `create_page`, `rename_page`, `delete_page`, `duplicate_page`, `export_project`, `export_workspace`.

Library mutations require `canvasId`, `expectedRevision`, and explicit target IDs; their schemas do not require active-page `context` because they already identify the library target. `list_canvases` and every tool response return active context. Use `open_file` with optional `pageId` to focus the intended page, then read state before content edits. Wrong context fails even if node IDs happen to be identical across copied files.

`get_document` returns a legacy-shaped active-page projection plus file/page metadata, not a whole-file backup. Use `get_file` or `export_document` JSON for every page. `get_tree` returns the active-page layer tree and a file page index. Node IDs are scoped to a file and remain unique across that file's pages. Imported/duplicated files receive new file IDs; duplicated pages receive new page/node IDs.

Project/file deletion is permanent and not in canvas undo history. Page deletion and file renames use that file's undo history. At least one project, file per project, and page per file must remain. File duplication creates an independent copy and a fresh history. Tokens are shared across a file's pages. The complete workspace is stored in IndexedDB with stale-tab write rejection.

This is a tool-schema change for existing agents: reload the MCP client and re-pair after upgrading. Older callers without context cannot mutate page content. The separate shared-broker increment is documented in mcp-multi-session.md.

SVG preserves supported artwork. HTML export is a standalone document containing that SVG, not semantic HTML/CSS layout. JSX export is a React component containing SVG JSX, not a semantic component reconstruction. JSON exports the complete editable document.

PNG screenshots render supported artwork, not editor chrome. They use the browser's SVG/image/canvas pipeline. Maximum side is 4096 pixels and maximum area is eight megapixels. Use a smaller scale or select one artboard if a document is too large. Text does not automatically wrap, so overflow and artboard clipping are preserved.

### Static HTML import

`write_html` creates editable primitives inside an existing artboard. Input is parsed inertly and never mounted, executed, or fetched.

Supported tags: div, section, article, header, footer, main, aside, nav, span, p, h1, h2, h3, button, label, img, ul, li, a. These are imported as visual primitives, not interactive web controls.

Supported attributes: `style`, `data-layer-name`, `src`, `alt`. IDs, classes, event handlers, links, and other attributes are rejected.

Supported styles: position, left, top, width, height, padding, background, background-color, color, font-size, font-family, font-weight, border-radius, opacity, text-align, display. Dimensions must be pixel numbers. Colors accept hex or RGB. Fonts and weights must match the document schema. Block flow is a restricted vertical stack; absolute positioning uses the containing block's origin. Text must occupy its own element. Font/color inheritance and CSS group-opacity semantics are not implemented.

Scripts, stylesheets, embeds, SVG/MathML markup, network image URLs, CSS variables, expressions, important declarations, flex/grid, mixed rich text, and unsupported CSS/attributes are rejected. At most 100 generated layers and 20 nesting levels per import. Invalid input commits nothing. This is not arbitrary website rendering or Paper's full HTML importer.

### Design tokens

`get_design_tokens`, `set_design_tokens`, `apply_design_token`.

Documents store at most 200 named color, number, or font tokens. Applying a token copies its value to compatible node properties in one undo step. There are no dynamic references; later token edits do not change previously styled layers. Tokens are managed through MCP and JSON in this increment, not a new visual token editor.

## Security and limits

- Stdio is the agent boundary. The HTTP listener is not an unauthenticated MCP API.
- Loopback binding, code validation, exact-origin validation, explicit canvas IDs, and per-request socket binding are separate checks.
- Browser commands and document mutations validate through shared Zod schemas. Unsupported kinds and properties fail.
- No shell execution, arbitrary file reads/writes, remote asset fetching, HTML execution, or Paper credentials are exposed.
- Requests/responses are limited to 12 MB and 30 seconds. The editor limits each page to 1,000 layers, each file to 100 pages/10,000 layers and 80 session-history snapshots, and the workspace to 50 projects/50 files per project/200 files total.
- The paired browser owns data. Closing it stops document access. There is no headless editor, server document database, or cross-browser file/page synchronization.
- After editing connector or tool source in development, reload and re-pair the browser. An existing WebSocket callback can retain the previous hot-reloaded implementation. Restart the MCP client after server/schema changes.

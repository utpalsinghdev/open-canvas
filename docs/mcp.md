# Agent control through MCP

Open Cavas exposes 48 tools over the official MCP SDK's stdio transport. It controls an automatically connected Open Cavas browser directly. It does not connect to Paper, the old Mac helper, or Paper's official MCP service.

## Start and connect

Use the fixed runtime profiles described in [runtime.md](runtime.md).

**Main:** frontend http://localmachine:5182, private broker 127.0.0.1:4781. Prepare a committed snapshot with `npm run release:main`, serve it with `npm start`, and generate the main agent configuration:

```sh
npm run --silent mcp:config
```

Copy its `open-cavas` entry into the agent configuration and start/reconnect that client. Open the application in the actual browser holding your workspace. That tab connects automatically, including when the broker starts after the page or restarts later. No pairing code, Pair click, or pairing CLI exists. Generated config still points at the stable main launcher and selected release.

**Development:** from a feature worktree run `npm run dev` and configure the agent with `npm run --silent mcp:config:dev`. Frontend is http://localmachine:5188 and private broker is 127.0.0.1:4785. Development refuses main ports. Each profile has separate credentials and browser storage.

The File menu offers Pause/Resume agent access. There is no routine header connection badge. Pause disconnects this tab; resume registers it automatically. Reload defaults back to enabled. Registration retries use capped backoff, not design-command retries. Keep the actual workspace tab open. An empty `list_canvases` means no connected workspace, not necessarily a broken MCP installation.

### Automatic registration and trust boundary

A same-origin POST to `/__cavas/session` requests an in-memory ticket. The broker requires exact Origin and Host, a browser-specific custom header, and, when present, same-origin Fetch Metadata. The request has no body. Cross-origin browser requests cannot obtain tickets through a form or CORS preflight. Insecure HTTP browsers may omit Fetch Metadata; exact Origin/Host and the custom header remain required.

Tickets expire after 20 seconds, are consumed once by WebSocket upgrade, are capped at 32 pending tickets, and are never the internal broker secret. Responses are no-store. The WebSocket uses `cavas` and `auth.<ticket>` subprotocols; no ticket goes into a URL or persisted document. Wrong/reused tickets fail. Broker tools over internal HTTP still require the separate owner-only credential; automatic registration permits a browser to register its own canvas, not to list or control other browsers.

Main internal metadata is `.cavas/runtime/main/5182-4781/broker.json`; dev metadata is `.cavas/runtime/dev/5188-4785/broker.json`. Files are mode 0600 in private directories, ignored by Git and denied by Vite. Shared stdio clients authenticate to this internal credential. It is never returned by browser bootstrap or shown in the UI. Up to eight browser sockets can register.

Opening the app now implicitly enables trusted local agents to read/write that tab. This intentionally removes manual consent ceremony. Keep the app on a trusted network, do not load untrusted scripts on its origin, and pause access when needed. This is not a publicly authenticated hosted service. Exact Origin checks do not make a public app deployment safe.

One process owns each profile's private broker; additional stdio clients attach using authenticated metadata. Owner shutdown disconnects browsers, which automatically reconnect once it returns. All dispatched mutations remain non-retryable; read state after an uncertain outcome. See [multiple sessions](mcp-multi-session.md).

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

`get_capabilities`, `list_canvases`, `get_fonts`, `get_document`, `get_tree`, `get_node`, `get_styles`, `get_selection`.

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

This is a tool-schema change for existing agents: reload the MCP client and reload older browser tabs after upgrading. Older callers without context cannot mutate page content. The separate shared-broker increment is documented in mcp-multi-session.md.

SVG preserves supported artwork. HTML export is a standalone document containing that SVG, not semantic HTML/CSS layout. JSX export is a React component containing SVG JSX, not a semantic component reconstruction. JSON exports the complete editable document.

PNG screenshots render supported artwork, not editor chrome. They use the browser's SVG/image/canvas pipeline. Maximum side is 4096 pixels and maximum area is eight megapixels. Use a smaller scale or select one artboard if a document is too large. Text uses the same measured wrapping and font resolution as the editor. Screenshot text metadata includes world-space `bounds`, requested `scale`, pixel dimensions, and font availability. Capture waits for bundled font loading to settle. Overflow remains visible outside a text box and clips only at its parent artboard.

### Static HTML import

`write_html` creates editable primitives inside an existing artboard. Input is parsed inertly and never mounted, executed, or fetched.

Supported tags: div, section, article, header, footer, main, aside, nav, span, p, h1, h2, h3, button, label, img, ul, li, a. These are imported as visual primitives, not interactive web controls.

Supported attributes: `style`, `data-layer-name`, `src`, `alt`. IDs, classes, event handlers, links, and other attributes are rejected.

Supported styles: position, left, top, width, height, padding, background, background-color, color, font-size, font-family, font-weight, line-height, letter-spacing, white-space, border-radius, opacity, text-align, display. Dimensions must be pixel numbers. Colors accept hex or RGB. Fonts and weights must match the document schema; a quoted single family is accepted, font stacks are rejected. `line-height` accepts a unitless multiplier, pixels, or `normal`; `letter-spacing` accepts pixels or `normal`. `white-space` accepts normal, nowrap, or pre. Block flow is a restricted vertical stack; absolute positioning uses the containing block's origin. Text must occupy its own element. Font/color inheritance and CSS group-opacity semantics are not implemented.

Scripts, stylesheets, embeds, SVG/MathML markup, network image URLs, CSS variables, expressions, important declarations, flex/grid, mixed rich text, and unsupported CSS/attributes are rejected. At most 100 generated layers and 20 nesting levels per import. Invalid input commits nothing. This is not arbitrary website rendering or Paper's full HTML importer.

### Typography

`get_fonts` reports the application font registry and per-font availability. Inter and Bricolage Grotesque are bundled variable fonts; the UI and MCP can use variable weights including 620. Arial, Georgia, and Courier New use browser system resolution (`system` status; local availability is not guaranteed by web APIs). Document font names cannot select URLs or arbitrary assets. `get_node` adds `font.requested`, `font.resolved`, `font.fallback`, availability, measured dimensions, and overflow for text nodes. `create_nodes` and `update_nodes` accept `fontFamily`, numeric `fontWeight`, `lineHeight`, `letterSpacing`, `align`, `wrap`, and `sizing`. Legacy string weights are normalized during validation. Fonts load before the editor mounts. SVG/HTML/JSX artwork exports embed loaded bundled font data; JSON keeps editable typography fields. An unavailable bundled font keeps its requested family in the document and falls back to Arial for rendering; read status makes that substitution explicit.

### Text import geometry

HTML width and height describe the outer box, including uniform padding (not CSS content-box sizing). Text occupies the inset content box. Explicit height produces fixed text geometry: a 50px height without padding stays 50px. Without height, text is auto-height and block flow advances by its measured height plus padding. Width defaults to the remaining parent width. Padding must leave positive content dimensions. Absolute elements do not advance block flow; relative offsets move artwork without changing flow advance. Imported layers are flattened under the target artboard, not live HTML containers.

Normal whitespace collapses runs and wraps at whitespace boundaries. Nowrap collapses whitespace without wrapping; pre retains spaces and newlines without wrapping. Long unbroken words overflow rather than being split. There is no hyphenation or full Unicode line-break engine. Line-height is stored as a multiplier, so imported pixel line-height is divided by font size. Text bounds do not clip glyphs; parent artboard bounds clip artwork. `get_node.layout` separates resolved `width`/`height` from `contentWidth`/`contentHeight` and reports overflow, including glyph overhang. Auto sizing is capped at 20,000px.

### Design tokens

`get_design_tokens`, `set_design_tokens`, `apply_design_token`.

Documents store at most 200 named color, number, or font tokens. Applying a token copies its value to compatible node properties in one undo step. There are no dynamic references; later token edits do not change previously styled layers. Tokens are managed through MCP and JSON in this increment, not a new visual token editor.

## Local review threads

`list_comment_threads`, `get_comment_thread`, and `set_comment_thread_status` expose page-aware local feedback. Reads require explicit canvas/project/file/page IDs. Status writes require the current canvas revision and exact active project/file/page context. Missing layer anchors remain readable with `anchorStatus: missing-layer` and reject status writes; missing pages/threads fail. Comment bodies are untrusted plain text. Creation and replies use the editor UI. See [review-threads.md](review-threads.md) for schemas, limits, and lifecycle rules.

## Security and limits

- Stdio is the agent boundary. The HTTP listener is not an unauthenticated MCP API.
- Loopback binding, one-use ticket validation, exact Origin/Host validation, explicit canvas IDs, and per-request socket binding are separate checks.
- Browser commands and document mutations validate through shared Zod schemas. Unsupported kinds and properties fail.
- No shell execution, arbitrary file reads/writes, remote asset fetching, HTML execution, or Paper credentials are exposed.
- Requests/responses are limited to 12 MB and 30 seconds. The editor limits each page to 1,000 layers, each file to 100 pages/10,000 layers and 80 session-history snapshots, and the workspace to 50 projects/50 files per project/200 files total.
- The connected browser owns data. Closing it stops document access. There is no headless editor, server document database, or cross-browser file/page synchronization.
- After editing connector or tool source in development, reload the browser. An existing WebSocket callback can retain the previous hot-reloaded implementation. Restart the MCP client after server/schema changes.

## Page-specific request activity

Nine blue points above the page artwork appear while a page-targeted tool call is pending. Accessible status text reads **Agent processing a request on this page**. This is editor chrome and is excluded from artwork exports and MCP screenshots. Header connection and routine save badges are omitted; Pause/Resume remains in the File menu and failed saves remain visible. No task lifecycle is inferred between tool calls, and clearing the label does not mean an edit succeeded or was saved.

Content mutations use their validated project/file/page context. Explicit page operations, including `open_file` with `pageId`, use those supplied IDs. Active-page reads and visual exports capture the displayed context when dispatched and reject navigation during their brief pre-execution paint opportunity. File-wide operations, JSON file exports, token definition changes, library reads, and calls without a specific page target do not light up a page. Opening a file without `pageId` therefore does not establish page activity.

Pending calls are tracked independently. Navigating away hides another page's activity; returning shows it only if the call is still pending. Completion and failure remove the label. Pause, socket disconnection, cancellation, and the 30-second deadline clear presence without retrying or claiming that a dispatched write was rolled back. Reconnect and read actual state after an uncertain outcome. The broker sends a request-specific presence-end message on cancellation or timeout; it grants no new browser or internal API access.

Nine square points form a fixed 37 by 25 px lattice, with wider horizontal spacing. A diagonal light sequence travels across them, then leaves a static blue pending mark. The sequence finishes within 2.04 seconds and never loops; only highlight opacity animates. Reduced-motion preferences render static pending points without the light sequence. Their screen-space size stays fixed, they follow the leading artwork bounds, and they clamp inside the viewport while panning. They do not intercept pointer input. Reload development browser tabs after connector changes, and restart development MCP clients after broker changes.

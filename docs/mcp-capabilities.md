# MCP capability coverage

Open Cavas owns its document model and MCP implementation.

## Implemented and live-verified through MCP

- Official SDK stdio initialize, tools/list, tools/call, tool errors, and browser targeting. 48 tools exposed.
- Live document/tree/node/style/selection reads with stable layer identity.
- Artboard creation, batch text/rectangle/image creation, text edits, property changes, rotation, artboard-and-child movement, duplication, deletion, reordering, and selection.
- Undo/redo through the same document history as manual edits.
- Restricted inert HTML import into editable layers. A background and text label were created and read back.
- Project/file/page lifecycle, explicit file/page navigation, per-file history, complete multi-page JSON export/import, project/workspace backups, and active-context checks. New/open document tools append files instead of replacing existing work.
- SVG, standalone SVG-based HTML, and SVG JSX export. PNG artwork capture returned as MCP image content.
- Persisted design token definition/read-back and explicit token application.
- Local page/layer/position review threads: list/read/status operations, stale/context rejection, explicit missing-layer results, page-copy anchor remapping, undo restoration, and complete-file JSON round trip verified through the live SDK. Human thread creation/replies use the editor; see review-threads.md.
- Manual text changes visible through MCP, stale-revision rejection, and focused manual-edit protection.
- Automatic browser registration without human code entry. Wrong Origin/Host, cross-site metadata, missing custom header, reused tickets, and unauthenticated internal requests are rejected.

Live verification used synthetic artwork in a dedicated browser session. Source-boundary checks and remaining checks are recorded in `verification.md`.

## Implemented capabilities and limits

- Layer types are the current Open Cavas primitives, not arbitrary DOM/CSS.
- Typography supports bundled Inter and Bricolage Grotesque variable fonts, numeric variable weights, line height, tracking, left/center/right alignment, explicit or measured wrapping, fixed/auto-height/auto-width sizing, and measured overflow/status reads. Other system fonts depend on browser availability. The bundled fonts are embedded in SVG-derived exports when loaded.
- HTML uses a documented static subset and restricted block layout. It is not arbitrary page import, flex/grid, rich text, or computed browser layout.
- HTML/JSX output represents SVG artwork, not semantic application UI or JSX from an original source tree.
- Screenshots capture supported artwork, not the editor window or a native Mac window.
- Tokens support color, number, and font metadata with literal assignment. No dynamic binding, theme inheritance, breakpoint/container token system, or UI token panel.
- Projects/files/pages persist in this browser origin through IndexedDB, not a remote service or filesystem library.

## Not implemented

third-party editable design document compatibility, auto layout, arbitrary vector paths, responsive web-layout semantics, dynamic theme tokens, shared server-side documents, multiplayer conflict merging, headless editing, hosted HTTP MCP are unsupported. Rich-text runs, arbitrary custom/document font registration, and embedding of third-party or system fonts are unsupported. The font registry is application-defined, not serialized per document.

No placeholder tools claim those capabilities. `get_tree` reports the active-page layer tree and the actual file page index. Adding a transport does not create editor features that the document model cannot represent.


## Multi-project increment

Projects contain multiple files, files contain multiple pages. Live SDK calls created/renamed/deleted projects/files/pages, duplicated complete files/pages, exercised per-file undo, read inactive files, exported project/workspace backups, and rejected wrong-file content context and last-file/page deletion. Browser UI migrated legacy storage, restored saved hierarchies after reload, and rejected stale-tab saves. Shared-broker support is documented separately in mcp-multi-session.md; adopting it requires restarting any pre-existing legacy owner.


## Automatic browser registration

Manual pairing commands and UI were removed at the user's request. Opening the real application tab is sufficient for registration when its local MCP broker is running. Late broker startup, page reload, and broker restart reconnect automatically; Pause/Resume is available as a per-tab opt-out. The internal shared-broker credential remains private and is not replaced by public unauthenticated tool access. No headless document storage or access to a closed browser's IndexedDB is claimed.
